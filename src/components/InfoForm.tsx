import React from "react";

export type InfoFormProps = {
  leftHeader: string
  rightHeader: string
  centerHeader: string
  footer: string
  chartNumber: string
  chartNumberStart: number
  pageNumberStart: number
}

function InfoForm(props: InfoFormProps) {
  return(
    <div className="info-form">
    </div>
  );
}

export default InfoForm;