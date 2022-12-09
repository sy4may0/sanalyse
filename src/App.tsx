import React from 'react';
import { useState, useEffect } from 'react';
import './App.css';
import { format } from 'date-fns';

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

import {createTheme, ThemeProvider } from '@mui/material/styles';

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

export type ChartDataResult = {
  promise: Promise<any>
  host: string
  metrics: string
  device: string
  rc: undefined|string
  chartdata: any
}

export type DBResultIOData = {
  datetime: Array<number>
  readsec: Array<number>
  writesec: Array<number>
}

const theme = createTheme({
  palette: {
    primary: {
      light: '#fffff6',
      main: '#f0f4c3',
      dark: '#bdc192',
      contrastText: '#000000',
    },
    secondary: {
      light: '#ffe54c',
      main: '#ffb300',
      dark: '#c68400',
      contrastText: '#fff8e1',
    },
  },
})

const metrics2ChartTitle: Map<string, string> = new Map([
  ['cpu', 'CPU Utilization'],
  ['memory', 'Memory Usage'],
  ['io', 'Disk IO'],
])

const metrics2JpTitle: Map<string, string> = new Map([
  ['cpu', 'CPU使用状況'],
  ['memory', 'メモリ使用状況'],
  ['io', 'ディスク使用状況'],
])

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
  const metricses: Array<string> = [
    'cpu',
    'memory',
    'io',
  ];
  const h: string = '';
  const m: string = 'cpu';
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
  const charts: Array<ChartDataResult> = [];

  const [hostlist, setHostlist] = useState(hosts);
  const [metricslist, setMetricslist] = useState(metricses);
  const [host, setHost] = useState(h);
  const [metrics, setMetrics] = useState(m);
  const [startDate, setStartDate] = React.useState<Date|null>(new Date());
  const [endDate, setEndDate] = React.useState<Date|null>(new Date());
  const [renderCharts, setRenderCharts] = useState(charts)

  // UseEffectの第二引数に空配列を渡すとコンポーネント読み込み時に1度だけ実行する処理を定義できる。
  useEffect(() => {
    axiosRequestor.get('/hostlist').then(function(res) {
      let hl = res.data;
      hl.push('all')
      setHostlist(hl);
      setHost(res.data[0]);
      console.log('update')
      console.log(res.data);
    });
  }, []);

  const handleChangeHost = (event: SelectChangeEvent) => {
    setHost(event.target.value as string);
  }
  const handleChangeMetrics = (event: SelectChangeEvent) => {
    setMetrics(event.target.value as string);
  }

  const getChartData = (
    metrics: string, 
    iodevice: string = '',
    host: string, 
    start: string, 
    end: string) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if(metrics === 'cpu') {
            resolve(axiosRequestor.get("/cpu_util/trend", {
              params: {
                host: host,
                start: start,
                end: end
              }
            }));
          }else if(metrics === 'memory') {
            resolve(axiosRequestor.get("/mem_use/trend", {
              params: {
                host: host,
                start: start,
                end: end
              }
            }));
          }else if(metrics === 'io') {
            resolve(axiosRequestor.get("io/trend", {
              params: {
                host: host,
                device: iodevice,
                start: start,
                end: end
              }
            }));
          }else {
            reject('undefined metrics')
          }
        }, 1000);
      })
  }

  const updateChartData2 = async () => {
    let chartDataResults: Array<ChartDataResult> = []; 
    let promises: Array<Promise<any>> = [];
    
    let hl: Array<string> = [];
    if(host === 'all') {
      hl = hostlist.filter(function(x){return x != 'all';});
    }else {
      hl = [host];
    }
    for(const h of hl) {
      if(metrics === 'io') {
        const devices = await axiosRequestor.get("/iodevicelist:" + h);
        for(const device of devices.data) {
          const promise = getChartData(
              metrics, device, h,
              formatDate(startDate!) + "T00:00:00",
              formatDate(endDate!) + "T23:59:59"
          );
          chartDataResults.push({
            promise: promise,
            host: h,
            metrics: metrics,
            device: device,
            rc: undefined,
            chartdata: undefined,
          })
          promises.push(promise);
        }

      }else {
        const promise = getChartData(
          metrics, '', h,
          formatDate(startDate!) + "T00:00:00",
          formatDate(endDate!) + "T23:59:59"
        );
        chartDataResults.push({
          promise: promise,
          host: h,
          metrics: metrics,
          device: '',
          rc: undefined,
          chartdata: undefined,
        })
        promises.push(promise);
      }
    }
    const resolvedPromises = await Promise.all(promises)
    for(let i = 0; i < resolvedPromises.length; i++) {
      const resPromise = resolvedPromises[i];
      chartDataResults[i].rc = resPromise.data.rc; 
      if (chartDataResults[i].metrics === 'cpu') {
        chartDataResults[i].chartdata = 
            buildCPUChartDataSet(resPromise.data.result); 
      }
      else if (chartDataResults[i].metrics === 'memory') {
        chartDataResults[i].chartdata = 
            buildMEMChartDataSet(resPromise.data.result); 
      }
      else if (chartDataResults[i].metrics === 'io') {
        chartDataResults[i].chartdata = 
            buildIOChartDataSet(resPromise.data.result, chartDataResults[i].device); 
      }
    }
    setRenderCharts(chartDataResults);
  }
  return (
    <div className="App">
      <ThemeProvider theme={theme}>
      <Box className="appbar-wrap ignore-print-area">
        <AppBar 
          position="static"
          color="primary"
        >
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
                <InputLabel id="host-select-label" className='appbar-inputlabel'>Metrics</InputLabel>
                <Select
                  className='appbar-selectbox'
                  labelId="metrics-select-label"
                  id="metrics-select"
                  value={metrics}
                  label='Metrics'
                  onChange={handleChangeMetrics}
                >
                {metricslist.map((h) => (
                  <MenuItem
                    key={h}
                    value={h}
                  >{h}</MenuItem>
                ))}
                </Select>
              </FormControl>
              </Box>
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
                onClick={updateChartData2}
                variant="contained"
                color='secondary'
              >Render</Button>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
       </Box>
       <Box className="head-space ignore-print-area"></Box>

      <Box className="App-header">
       {renderCharts.map((renderChart, index) => (
         <Box className='print-block page-break'>
          <Box>
            <ul className='print-header'>
              <li className='print-header-item-left'>
                <h4>報告資料15-2</h4>
              </li>
              <li className='print-header-item-center'>
                <h4>メモリ使用状況</h4>
              </li>
              <li className='print-header-item-right'>
                <h4></h4>
              </li>
            </ul>
         </Box>
          <Box className='print-block'>
           <LineChart
             title={metrics2ChartTitle.get(renderChart.metrics)!}
             host={renderChart.host}
             labels={renderChart.chartdata.labels}
             datasets={renderChart.chartdata.datasets}
             key={index}
           >
           </LineChart>
          </Box>
          <Box><p className='print-graph-number'>図11 メモリ使用状況 (hostname)</p></Box>
          <Box className='print-footer'>
            <h5>報告資料15-2</h5>
          </Box>
         </Box>
       ))}
      </Box>
      </ThemeProvider>
    </div>
  );
}

export default App;
