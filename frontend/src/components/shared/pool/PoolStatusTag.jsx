import React from 'react';

function PoolStatusTag({locked, resolved, cssClass}) {
  let [bgColor, status] = (() => {
    if (locked && resolved) 
      return ["bg-red-600", "CLOSED"]; 

    if (locked)
      return ["bg-blue-400", "LOCKED"];

    return ["bg-green-600", "OPEN"];
  })();

  return (
    <span className={`${bgColor} ${cssClass} rounded py-1 px-3`}>{status}</span>
  )
}

export default PoolStatusTag