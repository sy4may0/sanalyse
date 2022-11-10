import React from "react";
import DatePicker from 'react-datepicker';

import { HandleChangeDateFuncType } from "../App";

import "react-datepicker/dist/react-datepicker.css"

export type StartEndPickerProps = {
  startDate: Date
  endDate: Date
  handleChangeStartDate: HandleChangeDateFuncType
  handleChangeEndDate: HandleChangeDateFuncType
}

function StartEndPicker(props: StartEndPickerProps) {
  return(
    <div>
        <DatePicker
          selected={props.startDate}
          onChange={props.handleChangeStartDate}
        />
        <DatePicker
          selected={props.endDate}
          onChange={props.handleChangeEndDate}
        />
    </div>
  )
}

export default StartEndPicker