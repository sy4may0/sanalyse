import { Box, Button, FormControl, TextField } from "@mui/material";
import { cloneDeep } from "lodash";
import React, { useState } from "react";
import { HandleApplyPageSettingFuncType } from "../App";

export type PageSettingFormProps = {
  leftHeader: string
  rightHeader: string
  centerHeader: string
  footer: string
  chartNumber: string
  chartIndexStart: number
  pageIndexStart: number
  handleApply: HandleApplyPageSettingFuncType
}

const formItemTextStyle = {
  width: 640,
  margin: '0.5em'
}
const formItemNumberStyle = {
  width: 120,
  margin: '0.5em'
}
const formItemButtonStyle = {
  margin: '0.5em'
}

function PageSettingForm(props: PageSettingFormProps) {
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
  const handleChangeCenterHeader = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCenterHeader(event.target.value as string)
  }
  const handleChangeRightHeader = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRightHeader(event.target.value as string)
  }
  const handleChangeFooter = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFooter(event.target.value as string)
  }
  const handleChangeChartNumber = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChartNumber(event.target.value as string)
  }
  const handleChangeChartIndexStart = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChartIndexStart(Number(event.target.value))
  }
  const handleChangePageIndexStart = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPageIndexStart(Number(event.target.value))
  }
  const handleApplyPageSetting = () => {
    props.handleApply({
      leftHeader: leftHeader,
      centerHeader: centerHeader,
      rightHeader: rightHeader,
      footer: footer,
      chartNumber: chartNumber,
      chartIndexStart: chartIndexStart,
      pageIndexStart: pageIndexStart,
    })
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
          sx={formItemTextStyle}
        ></TextField>
        <TextField 
          id='center-header-input' 
          label='中央ヘッダー' 
          variant='standard'
          value={centerHeader}
          color='secondary'
          onChange={handleChangeCenterHeader}
          sx={formItemTextStyle}
        ></TextField>
        <TextField 
          id='right-header-input' 
          label='右ヘッダー' 
          variant='standard'
          value={rightHeader}
          color='secondary'
          onChange={handleChangeRightHeader}
          sx={formItemTextStyle}
        ></TextField>
        <TextField 
          id='footer-input' 
          label='フッター' 
          variant='standard'
          value={footer}
          color='secondary'
          onChange={handleChangeFooter}
          sx={formItemTextStyle}
        ></TextField>
         <TextField 
          id='chart-number-input' 
          label='図表名' 
          variant='standard'
          value={chartNumber}
          color='secondary'
          onChange={handleChangeChartNumber}
          sx={formItemTextStyle}
        ></TextField>
        <TextField 
          id='chart-index-input' 
          label='先頭の図表番号' 
          variant='standard'
          value={chartIndexStart}
          color='secondary'
          type='number'
          onChange={handleChangeChartIndexStart}
          sx={formItemNumberStyle}
        ></TextField>
         <TextField 
          id='page-index-input' 
          label='先頭のページ番号' 
          variant='standard'
          value={pageIndexStart}
          color='secondary'
          type='number'
          onChange={handleChangePageIndexStart}
          sx={formItemNumberStyle}
        ></TextField>
        <Box>
          <Button 
            onClick={handleApplyPageSetting}
            variant="contained"
            color='secondary'
            sx={formItemButtonStyle}
          >Apply</Button>
        </Box>
      </FormControl>
      </div>
  );
}

export default PageSettingForm;