import React from 'react';
import { useParams } from "react-router-dom";
import getSftDetails from "../../helpers/sftsMock";

function SftDetails() {
  const params = useParams();
  const sft = getSftDetails(params.id);
  console.log(sft);

  return (
    <div>
      <h1>SftDetails</h1>
    </div>
  )
}

export default SftDetails