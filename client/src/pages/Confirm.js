import React, {Component} from 'react'
import { Redirect } from 'react-router-dom'
import { notify } from 'react-notify-toast'
import { ACCOUNT_API } from '../config'
import { Dimmer, Form, Loader } from 'semantic-ui-react';
import Page from '../components/Page';

export default class Confirm extends Component {
  
  // A bit of state to give the user feedback while their email
  // address is being confirmed on the User model on the server.
  state = {
    email:'',
    confirming: false,
    verified: false
  }

  // This id is then sent to the server to confirm that 
  // the user has clicked on the link in the email. The link in the email will 
  // look something like this: 
  // 
  // http://server:port/verify/5c40d7607d259400989a9d42
  // 
  // where 5c40d...a9d42 is the token sent in email
  componentDidMount = () => {
  }

  handleChange =(e,{name, value})=>{
    this.setState({[name]: value})
  }

  onConfirm = event =>{
    event.preventDefault()
    const { id } = this.props.match.params
    this.setState({confirming: true})

    fetch(`${ACCOUNT_API}/api/verify`,{
      method: 'POST',
      headers: {
        accept: 'application/json', 
        'content-type': 'application/json'
      },
      body: JSON.stringify({token: id, email: this.state.email})
    }).then(res => res.json())
      .then(data => {
        window.localStorage.setItem('m360t', data.token);
        this.setState({ verified: true })
        notify.show(data.message)
      })
      .catch(err => {
        this.setState({error: err, errorMessage: 'Unable to confirm', verified: false})
        console.log(err)
      })
  }

  render = ()=>{
    const { confirming=false, verified } = this.state
    
    if (verified) {
      return <div>
        <Redirect
          to={{
            pathname: "/",
            state: { }
          }} />
      </div>
    }

    return (
    <Page loading={confirming} loadingMsg='Wait while we confirm...'>
      <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'80vh'}}>
        <Form
          onSubmit={this.onConfirm}>
          <Form.Group>
            <Form.Input 
              name='email' 
              type='email'
              required 
              placeholder='Confirm the registered email'
              value={this.state.email}
              onChange={this.handleChange}
              action={{color:'blue', content:'Confirm'}}
              size='huge'
            />
          </Form.Group>
        </Form>
      </div>
    </Page>
    )
  }
}
