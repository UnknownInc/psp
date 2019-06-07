import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faComment  } from '@fortawesome/free-regular-svg-icons'
import { Footer } from './Footer-Styles'

export default props => 
  <Footer>
    <p><a href="/tnc">Terms &amp; Conditions</a></p>
    <p><a href="/feedback"><FontAwesomeIcon icon={faComment}/> feedback </a></p>
  </Footer>
