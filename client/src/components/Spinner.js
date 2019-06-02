import React from 'react'
import { Loader } from 'semantic-ui-react';

export default props =>
  <div style={{display:'flex', justifyContent:'center', padding: "1em", minWidth:'600px', minHeight: '200px'}}>
    <Loader active size={props.size||'huge'}>{props.message||'Loading...'}</Loader>
  </div>
