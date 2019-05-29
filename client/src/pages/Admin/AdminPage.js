import React, {Component} from 'react';
import Spinner from '../../components/Spinner'
import { ACCOUNT_API, getHeaders } from '../../config'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faQuestion, faCogs } from '@fortawesome/free-solid-svg-icons'
import {Link} from 'react-router-dom';
import { Loader } from 'semantic-ui-react';
import Page from '../../components/Page';

class AdminPage extends Component {
  state = {
    loading: true
  }

  componentDidMount() {
    this.setState({loading: true})

    const headers= getHeaders();
    
    fetch(`${ACCOUNT_API}/api/profile`, { headers})
      .then(res => res.json())
      .then(profile => {
        if (profile.error) {
          this.setState({loading: false, profile: null})
        } else { 
          this.setState({loading: false, profile})
        }
      })
      .catch(err=>{
        this.setState({loading: false, profile: null})
      })
  }

  render(){
    const {loading=false, profile} = this.state;
    if (!profile || !profile.isAdmin) {
      return <div className="btn-panel">
        <h4>Not Authorized.</h4>
      </div>
    }

    return <Page loading={loading}>
      <div className="btn-panel">
      <Link to="/admin/users">
      <div className="btn">
        <div className="icon">
          <FontAwesomeIcon icon={faUser} size='4x'/>
        </div>
        Users
      </div>
      </Link>

      <Link to="/admin/questions">
      <div className="btn">
        <div className="icon">
          <FontAwesomeIcon icon={faQuestion} size='4x'/>
        </div>
        Questions
      </div>
      </Link>

      <Link to="/admin/settings">
      <div className="btn">
        <div className="icon">
          <FontAwesomeIcon icon={faCogs} size='4x'/>
        </div>
        Settings
      </div>
      </Link>
    </div>
  </Page>
  }
}

export default AdminPage;
