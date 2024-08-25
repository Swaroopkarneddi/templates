import React, { useState } from "react";
import "./css/SalesAnalysis.css";
//npm i ChartJS react-chartjs-2
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  plugins,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);
function SalesAnalysis() {
  const [a, seta] = useState(1000);
  const add = () => {
    seta(a + 1000);
  };
  const sub = () => {
    seta(a - 1000);
  };
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
      },
      title: {
        display: true,
        text: "jflkfmklhfnmhk",
      },
    },
  };
  const Linedata = {
    labels: [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ],
    datasets: [
      {
        label: "steps1",
        data: [3000, 4500, a, 5000, 1000, 3000, 8000],
        borderColor: "red",
      },
    ],
  };

  const Bardata = {
    labels: ["rent", "grosaries", "util", "ent", "transport"],
    datasets: [
      {
        label: "expences",
        data: [3000, a, 4500, 5000, 1000],
        backgroundColor: ["red", "blue"],
        borderColor: "black",
        borderWidth: 1,
      },
    ],
  };

  const Pidata = {
    labels: ["yt", "music", "games", "ent", "study"],
    datasets: [
      {
        label: "Time",
        data: [1000, a, 4500, 5000, 1000],
        backgroundColor: ["red", "blue", "gold", "black", "pink"],
        borderColor: "black",
        borderWidth: 1,
        hoverOffset: 4,
      },
    ],
  };

  return (
    <div>
      SalesAnalysis
      <br />
      <div className="a">
        <Line data={Linedata} options={options} />
      </div>
      <br />
      <button onClick={add}>+</button>
      <button onClick={sub}> -</button>
      <br />
      <div className="a">
        <Bar data={Bardata} />
      </div>
      <br />
      <div className="a">
        <Pie data={Pidata} />
      </div>
    </div>
  );
}

export default SalesAnalysis;
