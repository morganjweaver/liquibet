import React from 'react';
import { NavLink } from "react-router-dom";

function CustomNavLink({ text, to }) {
  return (
    <NavLink to={to} className={({ isActive }) => (isActive ? 'current py-2' : 'py-2')}>{text}</NavLink>
  )
}

export default CustomNavLink