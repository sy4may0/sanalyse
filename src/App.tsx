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

import axios from 'axios'
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';

import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import {createTheme, ThemeProvider } from '@mui/material/styles';
import ChartBlock from './components/ChartBlock';
import PageSettingForm from './components/PageSettingForm';
import { Backdrop, CircularProgress, Modal, Typography } from '@mui/material';

export type HandleChangeDateFuncType = (date: Date|null|undefined) => void;
export type HandleApplyPageSettingFuncType = (props: PageSetting) => void;
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
  unit: string
  ymax: undefined|number
  rc: undefined|string
  chartdata: any
}

export type DBResultIOData = {
  datetime: Array<number>
  readsec: Array<number>
  writesec: Array<number>
}

export type PageSetting = {
  leftHeader: string
  rightHeader: string
  centerHeader: string
  footer: string
  chartNumber: string
  chartIndexStart: number
  pageIndexStart: number
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

const modalStyle = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 720,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
};

const metrics2ChartTitle: Map<string, string> = new Map([
  ['cpu', 'CPU Utilization'],
  ['memory', 'Memory Usage'],
  ['io', 'Disk IO'],
])

const metrics2JP: Map<string, string> = new Map([
  ['cpu', 'CPU'],
  ['memory', 'メモリ'],
  ['io', 'ディスク'],
])

const metrics2Unit: Map<string, string> = new Map([
  ['cpu', '[%]'],
  ['memory', '[kb]'],
  ['io', '[sec/s]'],
])

const metrics2ymax: Map<string, number> = new Map([
  ['cpu', 100]
])

const axiosRequestor = axios.create({
  baseURL: "http://192.168.19.78:3000",
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
  responseType: "json",
})

function formatString(
    template: string, 
    values?: { [key: string]: string|number|null|undefined}
  ): string {
  return !values
  ? template
  : new Function(...Object.keys(values), `return \`${template}\`;`)(...Object.values(values).map(value=>value ?? ''))
}

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

  const initHosts: Array<string> = [];
  const initMetricses: Array<string> = [
    'cpu',
    'memory',
    'io',
  ];
  const initHostSelected: string = 'all';
  const initMetricsSelected: string = 'cpu';
  const initCharts: Array<ChartDataResult> = [];
  const initPageSetting: PageSetting = {
    leftHeader: "報告資料15-3",
    rightHeader: "",
    centerHeader: "${metrics}使用状況",
    footer: "報告資料15-3-${pageIndex}",
    chartNumber: "図${chartIndex} ${metrics}使用状況 (${host})",
    chartIndexStart: 21,
    pageIndexStart: 1,
  }

  const [hostlist, setHostlist] = useState(initHosts);
  const [metricslist, setMetricslist] = useState(initMetricses);
  const [hostSelected, setHost] = useState(initHostSelected);
  const [metricsSelected, setMetrics] = useState(initMetricsSelected);
  const [startDate, setStartDate] = React.useState<Date|null>(new Date());
  const [endDate, setEndDate] = React.useState<Date|null>(new Date());
  const [renderCharts, setRenderCharts] = useState(initCharts)
  const [pageSettingModalOpen, setPageSettingModalOpen] = useState(false)
  const [pageSetting, setPageSetting] = useState(initPageSetting)
  const [backdropOpen, setBackdropOpen] = useState(false)

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

  const updateChartData = async () => {
    handleBackdropOpen();

    let chartDataResults: Array<ChartDataResult> = []; 
    let promises: Array<Promise<any>> = [];
    
    let hl: Array<string> = [];
    if(hostSelected === 'all') {
      hl = hostlist.filter(function(x){return x != 'all';});
    }else {
      hl = [hostSelected];
    }
    for(const h of hl) {
      if(metricsSelected === 'io') {
        const devices = await axiosRequestor.get("/iodevicelist:" + h);
        for(const device of devices.data) {
          const promise = getChartData(
              metricsSelected, device, h,
              formatDate(startDate!) + "T00:00:00",
              formatDate(endDate!) + "T23:59:59"
          );
          chartDataResults.push({
            promise: promise,
            host: h,
            metrics: metricsSelected,
            device: device,
            unit: metrics2Unit.get(metricsSelected)!,
            ymax: metrics2ymax.get(metricsSelected),
            rc: undefined,
            chartdata: undefined,
          })
          promises.push(promise);
        }

      }else {
        const promise = getChartData(
          metricsSelected, '', h,
          formatDate(startDate!) + "T00:00:00",
          formatDate(endDate!) + "T23:59:59"
        );
        chartDataResults.push({
          promise: promise,
          host: h,
          metrics: metricsSelected,
          device: '',
          unit: metrics2Unit.get(metricsSelected)!,
          ymax: metrics2ymax.get(metricsSelected),
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
    handleBackdropClose();
  }

  const handlePageSettingModalOpen  = () => {
    setPageSettingModalOpen(true)
  }
  const handlePageSettingModalClose  = () => {
    setPageSettingModalOpen(false)
  }

  const handleBackdropOpen = () => {
    setBackdropOpen(true)
  }
  const handleBackdropClose = () => {
    setBackdropOpen(false)
  }

  const handleApplyPageSetting: HandleApplyPageSettingFuncType = (props: PageSetting) => {
    const newPageSetting: PageSetting = {
      leftHeader: props.leftHeader,
      centerHeader: props.centerHeader,
      rightHeader: props.rightHeader,
      footer: props.footer,
      chartNumber: props.chartNumber,
      chartIndexStart: props.chartIndexStart,
      pageIndexStart: props.pageIndexStart,
    };
    setPageSetting(newPageSetting);
    handlePageSettingModalClose();
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
                  value={metricsSelected}
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
                  value={hostSelected}
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
                  onClick={handlePageSettingModalOpen}
                  color='secondary'
                >Page Setting</Button>
              </Box>
              <Box className='appbar-form-item'>
                <Button 
                  onClick={updateChartData}
                  variant="contained"
                  color='secondary'
                >Render</Button>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
       </Box>
       <Box className="head-space ignore-print-area">
      </Box>
      <Box className="ignore-print-area">
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1}}
          open={backdropOpen}
        >
          <CircularProgress color="inherit"></CircularProgress>
        </Backdrop>
        <Modal
          open={pageSettingModalOpen}
          onClose={handlePageSettingModalClose}
          aria-labelledby="modal-page-setting"
          aria-describedby="modal-form-description"
        >
          <Box className='page-setting-modal' sx={modalStyle}>
            <Container>
              <Typography id="modal-page-setting" variant='h6' component='h2'>
                Page Settings
              </Typography>
              <hr></hr>
              <PageSettingForm
                leftHeader={pageSetting.leftHeader}
                centerHeader={pageSetting.centerHeader}
                rightHeader={pageSetting.rightHeader}
                footer={pageSetting.footer}
                chartNumber={pageSetting.chartNumber}
                chartIndexStart={pageSetting.chartIndexStart}
                pageIndexStart={pageSetting.pageIndexStart}
                handleApply={handleApplyPageSetting}
              ></PageSettingForm>
            </Container>
          </Box>
        </Modal>
      </Box>
      <Box className="App-header">
        {renderCharts.map((renderChart, index) => (
          <ChartBlock
            chartTitle={metrics2ChartTitle.get(renderChart.metrics)!}
            chartHost={renderChart.host}
            metrics={renderChart.metrics}
            chartLabels={renderChart.chartdata.labels}
            chartDatasets={renderChart.chartdata.datasets}
            leftHeader={formatString(pageSetting.leftHeader,
              {
                host: renderChart.host.split('.')[0],
                metrics: metrics2JP.get(renderChart.metrics)!,
                pageIndex: index + pageSetting.pageIndexStart,
                chartIndex: index + pageSetting.chartIndexStart,
              }
              )}
            rightHeader={formatString(pageSetting.rightHeader,
              {
                host: renderChart.host.split('.')[0],
                metrics: metrics2JP.get(renderChart.metrics)!,
                pageIndex: index + pageSetting.pageIndexStart,
                chartIndex: index + pageSetting.chartIndexStart,
 
              }
              )}
            centerHeader={formatString(pageSetting.centerHeader,
              {
                host: renderChart.host.split('.')[0],
                metrics: metrics2JP.get(renderChart.metrics)!,
                pageIndex: index + pageSetting.pageIndexStart,
                chartIndex: index + pageSetting.chartIndexStart,
              }
              )}
            footer={formatString(pageSetting.footer,
              {
                host: renderChart.host.split('.')[0],
                metrics: metrics2JP.get(renderChart.metrics)!,
                pageIndex: index + pageSetting.pageIndexStart,
                chartIndex: index + pageSetting.chartIndexStart,
              }
              )}
            chartNumber={formatString(pageSetting.chartNumber,
              {
                host: renderChart.host.split('.')[0],
                metrics: metrics2JP.get(renderChart.metrics)!,
                pageIndex: index + pageSetting.pageIndexStart,
                chartIndex: index + pageSetting.chartIndexStart,
              }
              )}
            pageIndex={index + pageSetting.pageIndexStart}
            unit={renderChart.unit}
            ymax={renderChart.ymax}
            key={index}
          ></ChartBlock>
        ))}
       </Box>
      </ThemeProvider>
    </div>
  );
}

export default App;
