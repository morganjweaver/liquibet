import { ethers } from 'ethers';

function formatDateTime(timestamp) {
  let date = new Date(formatTimestamp(timestamp));
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}` ;
}

function formatPeriod(timestamp) {
  
  var date = new Date(formatTimestamp(timestamp));
  
  var hours = date.getHours();
  var minutes = "0" + date.getMinutes();
  var seconds = "0" + date.getSeconds();
  
  // Will display time in 10:30:23 format
  return `${hours}h : ${minutes}m : ${seconds}s`;
}

function formatTimestamp(timestamp) {
  return ethers.utils.formatUnits(timestamp, 0) * 1000;
}

export {
  formatDateTime,
  formatPeriod
}