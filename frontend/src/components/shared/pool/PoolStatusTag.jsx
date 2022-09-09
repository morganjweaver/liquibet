import React from 'react';

function PoolStatusTag({locked, resolved}) {
  let [statusClass, status] = (() => {
    if (locked && resolved) 
      return ["bg-red-600", "CLOSED"]; 

    if (locked)
      return ["bg-blue-400", "LOCKED"];

    return ["bg-green-600", "OPEN"];
  })();

  return (
    <span className={`${statusClass} rounded py-1 px-3 absolute left-8 top-2`}>{status}</span>
  )
}

export default PoolStatusTag