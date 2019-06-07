import React from 'react';
import { Button, Icon, Popup, Responsive } from "semantic-ui-react";

const ResponsiveButton = (props) =>{
  const {minWidth, maxWidth, icon, text, ...otherProps} = props;
  return <Button {...otherProps}>
    <Popup trigger={<Icon name={icon}/>}>{text}</Popup>
    <Responsive as={'span'} maxWidth={maxWidth} minWidth={minWidth}>{text}</Responsive>
  </Button>
}

export default ResponsiveButton;
