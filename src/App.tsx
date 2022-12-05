import React from 'react';
import { useState, useEffect } from 'react';
import './App.css';
import { format } from 'date-fns';
import cloneDeep from 'lodash/cloneDeep'

import Box from '@mui/material/Box'
import AppBar from '@mui/material/AppBar'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Select, { SelectChangeEvent } from '@mui/material/Select'

import LineChart from './components/LineChart';

import axios from 'axios'
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';

import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

export type HandleChangeDateFuncType = (date: Date|null|undefined) => void;
export type DBResultCPUData = {
  datetime: Array<number>
  usr: Array<number>
  nice: Array<number>
  sys: Array<number>
  iowait: Array<number>
  steal: Array<number>
  irq: Array<number>
  soft: Array<number>
  guest: Array<number>
  idle: Array<number>
};

export type DBResultMemData = {
  datetime: Array<number>
  kbmemfree: Array<number>
  kbmemused: Array<number>
  kbbuffers: Array<number>
  kbcached: Array<number>
  kbcommit: Array<number>
};

export type DBResultIOData = {
  datetime: Array<number>
  readsec: Array<number>
  writesec: Array<number>
}

const axiosRequestor = axios.create({
  baseURL: "http://192.168.19.78:3000",
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
  responseType: "json",
})

function formatDate(date: Date): String {
  return format(date, 'yyyy-MM-dd')
}

function buildCPUChartDataSet(result: DBResultCPUData): any {
  let x = new Array<Date>()
  for(const unixTime of result.datetime) {
    x.push(new Date(unixTime*1000));
  }
  const graphData = {
    labels: x,
    datasets:[
      {
        label: "usr(%)",
        data: result.usr,
        borderColor: "hsl(0, 80%, 55%)",
        borderWidth: "1.5",
      },
      {
        label: "nice(%)",
        data: result.nice,
        borderColor: "hsl(40, 80%, 55%)",
        borderWidth: "1.5",
      },
      { 
        label: "sys(%)",
        data: result.sys,
        borderColor: "hsl(80, 80%, 55%)",
        borderWidth: "1.5",
      },
      { 
        label: "iowait(%)",
        data: result.iowait,
        borderColor: "hsl(120, 80%, 55%)",
        borderWidth: "1.5",
      },
      { 
        label: "steal(%)",
        data: result.steal,
        borderColor: "hsl(160, 80%, 55%)",
        borderWidth: "1.5",
      },
      { 
        label: "irq(%)",
        data: result.irq,
        borderColor: "hsl(200, 80%, 55%)",
        borderWidth: "1.5",
      },
      { 
        label: "soft(%)",
        data: result.soft,
        borderColor: "hsl(240, 80%, 55%)",
        borderWidth: "1.5",
      },
      { 
        label: "guest(%)",
        data: result.guest,
        borderColor: "hsl(280, 80%, 55%)",
        borderWidth: "1.5",
      },
      { 
        label: "idle(%)",
        data: result.idle,
        borderColor: "hsl(320, 80%, 55%)",
        borderWidth: "1.5",
      },
    ]
  }

  return graphData;
}

function buildMEMChartDataSet(result: DBResultMemData): any {
  let x = new Array<Date>()

  for(let i = 0; i < result.datetime.length; i++) {
    x.push(new Date(result.datetime[i]*1000));
  }

  const graphData = {
    labels: x,
    datasets:[
      {
        label: "used(kb)",
        data: result.kbmemused,
        borderColor: "hsla(0, 80%, 55%, 1)",
        borderWidth: "1.5",
      },
      {
        label: "buffer(kb)",
        data: result.kbbuffers,
        borderColor: "hsla(90, 80%, 55%, 1)",
        borderWidth: "1.5",
      },
      { 
        label: "cache(kb)",
        data: result.kbcached,
        borderColor: "hsla(180, 80%, 55%, 1)",
        borderWidth: "1.5",
      },
      { 
        label: "free(kb)",
        data: result.kbmemfree,
        borderColor: "hsla(270, 80%, 55%, 1)",
        borderWidth: "1.5",
      },
    ]
  }

  return graphData;
}

function buildIOChartDataSet(result: DBResultIOData, device: string): any {
  let x = new Array<Date>()

  for(let i = 0; i < result.datetime.length; i++) {
    x.push(new Date(result.datetime[i]*1000));
  }

  const graphData = {
    labels: x,
    datasets:[
      {
        label: device + " read(sec)/s",
        data: result.readsec,
        borderColor: "hsla(0, 80%, 55%, 1)",
        borderWidth: "1.5",
      },
      { 
        label: device + " write(sec)/s",
        data: result.writesec,
        borderColor: "hsla(180, 80%, 55%, 1)",
        borderWidth: "1.5",
      },
    ]
  }

  return graphData;
}

function App() {

  const hosts: Array<string> = [];
  const h: string = '';
  const cpuChart = {
    labels: [new Date()],
    datasets: [{
      label: 'null', data: [0], borderColor:"hsl(0,0%,0%)"
    }],
  };
  const memChart = {
    labels: [new Date()],
    datasets: [{
      label: 'null', data: [0], borderColor:"hsl(0,0%,0%)"
    }],
  };
  const ioChart: Array<any> = [];

  const [hostlist, setHostlist] = useState(hosts);
  const [host, setHost] = useState(h);
  const [startDate, setStartDate] = React.useState<Date|null>(new Date());
  const [endDate, setEndDate] = React.useState<Date|null>(new Date());
  const [cpuChartData, setCpuChartData] = useState(cpuChart);
  const [memChartData, setMemChartData] = useState(memChart);
  const [ioChartData, setIOChartData] = useState(ioChart);

  // UseEffectの第二引数に空配列を渡すとコンポーネント読み込み時に1度だけ実行する処理を定義できる。
  useEffect(() => {
    axiosRequestor.get('/hostlist').then(function(res) {
      setHostlist(res.data);
      setHost(res.data[0]);
      console.log('update')
      console.log(res.data);
    });
  }, []);

  const handleChangeHost = (event: SelectChangeEvent) => {
    setHost(event.target.value as string);
  }

  const updateChartData = () => {
    let iocd: Array<any> = new Array<any>;
    axiosRequestor.get("/cpu_util/trend",{
      params: {
        host: host,
        start: formatDate(startDate!) + "T00:00:00",
        end: formatDate(endDate!) + "T23:59:59"
      }

    }).then(function(res) {
      console.log("cpu_use set updated. rc is " + res.data.rc);
      const cpuChartDataSet = buildCPUChartDataSet(res.data.result);
      setCpuChartData(cpuChartDataSet);
    });

    axiosRequestor.get("/mem_use/trend",{
      params: {
        host: host,
        start: formatDate(startDate!) + "T00:00:00",
        end: formatDate(endDate!) + "T23:59:59"
      }
    }).then(function(res) {
      console.log("mem_use set updated. rc is " + res.data.rc)
      const memChartDataSet = buildMEMChartDataSet(res.data.result)
      setMemChartData(memChartDataSet)
    });

    axiosRequestor.get("/iodevicelist:" + host).then(function(res) {
      for(const device of res.data) {
        axiosRequestor.get("io/trend", {
          params: {
            host: host,
            device: device,
            start: formatDate(startDate!) + "T00:00:00",
            end: formatDate(endDate!) + "T23:59:59"
          }
        }).then(function(res) {
          console.log("io set update. rc is " + res.data.rc)
          iocd.push(buildIOChartDataSet(res.data.result, device))
          setIOChartData(cloneDeep(iocd))
        });
      }
    });
  };

  return (
    <div className="App">
      <header className="App-header">
      <Box className="appbar-wrap ignore-print-area">
        <AppBar position="static" color='transparent'>
          <Container maxWidth="xl">
            <Toolbar disableGutters>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Box className='appbar-form-item'>
                <DatePicker
                  className='appbar-datepicker'
                  label="start"
                  value={startDate}
                  onChange={(newValue) =>{ setStartDate(newValue) }}
                  renderInput={(params) => <TextField {...params}/>}
                  
                ></DatePicker>
                </Box>

                <Box className='appbar-form-item'>
                <DatePicker
                  className='appbar-datepicker'
                  label="end"
                  value={endDate}
                  onChange={(newValue) =>{ setEndDate(newValue) }}
                  renderInput={(params) => <TextField {...params}/>}
                ></DatePicker>
                </Box>
              </LocalizationProvider>
              <Box className='appbar-form-item'>
              <FormControl>
                <InputLabel id="host-select-label" className='appbar-inputlabel'>Host</InputLabel>
                <Select
                  className='appbar-selectbox'
                  labelId="host-select-label"
                  id="host-select"
                  value={host}
                  label='Host'
                  onChange={handleChangeHost}
                >
                {hostlist.map((h) => (
                  <MenuItem
                    key={h}
                    value={h}
                  >{h}</MenuItem>
                ))}
                </Select>
              </FormControl>
              </Box>
              <Box className='appbar-form-item'>
              <Button 
                onClick={updateChartData}
                variant="contained"
                color='primary'
              >Render</Button>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
       </Box>

       <Box className='print-block'>
          <LineChart
            title={'CPU Utilization'}
            host={host}
            labels={cpuChartData.labels}
            datasets={cpuChartData.datasets}
          >
          </LineChart>
        </Box>

        <Box className='print-block page-break'>
          <LineChart
            title={'Memory Usage'}
            host={host}
            labels={memChartData.labels}
            datasets={memChartData.datasets}
          >
          </LineChart>
        </Box>

        {ioChartData.map((iocd, index) => (
          <Box className='print-block page-break'>
            <LineChart
              title={'Disk IO'}
              host={host}
              key={index}
              labels={iocd.labels}
              datasets={iocd.datasets}
            >
            </LineChart>
          </Box>
        ))}
      </header>
    </div>
  );
}

export default App;
