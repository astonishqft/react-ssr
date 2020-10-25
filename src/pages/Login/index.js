import React from 'react';
import { Link } from 'react-router-dom';

export default () => {
  return (
    <div>
      <div>
        a标签跳转到：<a href="/">Home Page</a>
        Link标签跳转到 <Link to="/">Home Page</Link>
      </div>
      <h2>Login page</h2>
    </div>
  );
}
