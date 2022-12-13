import { FormControl, TextField } from "@mui/material";
import { cloneDeep } from "lodash";
import React, { useState } from "react";

export type InfoFormProps = {
  leftHeader: string
  rightHeader: string
  centerHeader: string
  footer: string
  chartNumber: string
  chartIndexStart: number
  pageIndexStart: number
}

function InfoForm(props: InfoFormProps) {
  const [leftHeader, setLeftHeader] = useState(cloneDeep(props.leftHeader))
  const [centerHeader, setCenterHeader] = useState(cloneDeep(props.centerHeader))
  const [rightHeader, setRightHeader] = useState(cloneDeep(props.rightHeader))
  const [footer, setFooter] = useState(cloneDeep(props.footer))
  const [chartNumber, setChartNumber] = useState(cloneDeep(props.chartNumber))
  const [chartIndexStart, setChartIndexStart] = useState(cloneDeep(props.chartIndexStart))
  const [pageIndexStart, setPageIndexStart] = useState(cloneDeep(props.pageIndexStart))
  const handleChangeLeftHeader = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLeftHeader(event.target.value as string)
  }
  return(
    <div className="info-form">
      <FormControl>
        <TextField 
          id='left-header-input' 
          label='左ヘッダー' 
          variant='standard'
          value={leftHeader}
          color='secondary'
          onChange={handleChangeLeftHeader}
        ></TextField>
        <TextField 
          id='center-header-input' 
          label='中央ヘッダー' 
          variant='standard'
          value={props.centerHeader}
          color='secondary'
        ></TextField>
        <TextField 
          id='right-header-input' 
          label='右ヘッダー' 
          variant='standard'
          value={props.rightHeader}
          color='secondary'
        ></TextField>
        <TextField 
          id='footer-input' 
          label='フッター' 
          variant='standard'
          value={props.footer}
          color='secondary'
        ></TextField>
         <TextField 
          id='chart-number-input' 
          label='図表名' 
          variant='standard'
          value={props.chartNumber}
          color='secondary'
        ></TextField>
        <TextField 
          id='chart-index-input' 
          label='先頭の図表番号' 
          variant='standard'
          value={props.chartIndexStart}
          color='secondary'
          type='number'
        ></TextField>
         <TextField 
          id='page-index-input' 
          label='先頭のページ番号' 
          variant='standard'
          value={props.pageIndexStart}
          color='secondary'
          type='number'
        ></TextField>
      </FormControl>
      </div>
  );
}

export default InfoForm;