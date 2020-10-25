import React, { Component } from 'react';
import axios from 'axios';
import styles from './index.less';

class Home extends Component {
  static getInitialProps = async () => {
    // const entry = 'http:localhost:3000/api/list'
    // const { list = [] } = await axios(entry);

    return {
      home: {
        list: [],
      },
    };
  };

  render() {
    return (
      <div className={styles.container}>
        <h2>Home page</h2>
      </div>
    );
  }
}

// Home.getInitialProps = async () => {
//   console.log(88888)
//   // const entry = 'http:localhost:3000/api/list'
//   // try {
//   //   const { list = [] } = await axios(entry);

//   // } catch(error) {
//   //   console.log('error', error)
//   // }

//   const list = await new Promise(function(resolve, reject) {
//     setTimeout(function() {
//       resolve('成功')
//     })
//   })

//   return {
//     home: {
//       list,
//     },
//   };
// };

export default Home;
