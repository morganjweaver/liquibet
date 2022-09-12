import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className='text-center bg-black text-white'>
        <p>Oops - we've looked everywhere but couldn't find this.</p>
        <Link to="/"><button>Return to home page</button></Link>
    </div>
  );
};

export default NotFound;