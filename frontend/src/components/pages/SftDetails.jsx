import React from 'react';
import { useParams } from "react-router-dom";
import getSftDetails from "../../helpers/sftsMock";
import LoadingComponent from "../shared/LoadingComponent";

function SftDetails() {
  const params = useParams();
  const sft = getSftDetails(params.id);
  console.log(sft);

  // if (!dataFetched) return <LoadingComponent />;

  return (
    <div>
      <h1>SftDetails</h1>
    </div>
  )
}

export default SftDetails