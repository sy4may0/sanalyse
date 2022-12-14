import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js'
import 'chartjs-adapter-date-fns';
import { Line } from "react-chartjs-2"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
);

export type ChartDataProps = {
  children: never[]|undefined|null
  title: string
  host: string
  labels: Array<Date>
  datasets: Array<any>
  ymax: number|undefined
  unit: string
};

function LineChart(props: ChartDataProps) {
  const data = {
    labels: props.labels,
    datasets: props.datasets,
  };

  const options: {} = {
    responsive: true,
    elements: {
      point:{
        radius: 0,
      }
    },
    scales:{
     y: {
        beginAtZero: true,
        max: props.ymax,
        ticks : {
          callback: function(tick: any) {
            return tick.toString() + props.unit;
          }
        }
      },
      x: {
        type: 'time',
        adapters: {
        },
        time: {
          unit: 'day',
          stepSize: 1,
          displayFormats: {
            'day': 'MM/dd'
          }
        }
      },
    },
    plugins: {
      legend: {
         position: 'top' as const,
      },
      title: {
        display: true,
        text: props.title + ' : ' + props.host,
      },
    },
  };

  const divStyle: React.CSSProperties = {
    marginLeft: "auto",
    marginRight: "auto",
    margin: "10px",
    width: "980px",
  };

  return(
    <div className="LineChart" style={divStyle}>
      <Line
        data={data}
        options={options}
      />
    </div>
  );
}

export default LineChart