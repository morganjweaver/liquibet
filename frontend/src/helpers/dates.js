import { ethers } from 'ethers';

function formatDateTime(timestamp) {
  let date = new Date(formatTimestamp(timestamp));
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}` ;
}

function formatPeriod(timestamp) {
  
  let d = Number(timestamp);
  var hours = Math.floor(d / 3600);
  var minutes = Math.floor(d % 3600 / 60);
  var seconds = Math.floor(d % 3600 % 60);
  
  // Will display time in 10:30:23 format
  return `${hours}h : ${minutes}m : ${seconds}s`;
}

function formatTimestamp(timestamp) {
  return ethers.utils.formatUnits(timestamp, 0) * 1000;
}

export {
  formatDateTime,
  formatPeriod,
  formatTimestamp
}