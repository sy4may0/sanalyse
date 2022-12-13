import { Box } from "@mui/material";
import React from "react";
import LineChart from "./LineChart";

export type ChartBlockProps = {
  chartTitle: string
  chartHost: string
  chartLabels: Array<Date>
  chartDatasets: Array<any>
  leftHeader: string
  rightHeader: string
  centerHeader: string
  footer: string
  chartNumber: string
  metrics: string
  pageIndex: number
  unit: string
  ymax: number|undefined
  key: number
}

function ChartBlock(props: ChartBlockProps) {
  return(
    <Box className='print-block page-break'>
     <Box>
       <ul className='print-header'>
         <li className='print-header-item-left'>
           <h4>{props.leftHeader}</h4>
         </li>
         <li className='print-header-item-center'>
           <h4>{props.centerHeader}</h4>
         </li>
         <li className='print-header-item-right'>
           <h4>{props.rightHeader}</h4>
         </li>
       </ul>
    </Box>
     <Box className='print-block'>
      <LineChart
        title={props.chartTitle}
        host={props.chartHost}
        labels={props.chartLabels}
        datasets={props.chartDatasets}
        ymax={props.ymax}
        unit={props.unit}
        key={props.key}
      >
      </LineChart>
     </Box>
     <Box><p className='print-graph-number'>{props.chartNumber}</p></Box>
     <Box className='print-footer'>
       <h5>{props.footer}</h5>
     </Box>
    </Box>
  );
}

export default ChartBlock;