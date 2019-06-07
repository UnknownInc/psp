import React, {Component} from 'react';
import { getProfile } from '../../config'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faQuestion, faCogs } from '@fortawesome/free-solid-svg-icons'
import {Link} from 'react-router-dom';
import Page from '../../components/Page';

class AdminPage extends Component {
  state = {
    loading: true
  }

  async componentDidMount() {
    this.setState({loading: true})
    const errorHdr = 'Unable to retrive the logged in user profile.';
    try {
      const {profile, errors} = await getProfile()
      if (errors.length>0) {
        this.setState({loading: false, profile, errors:errors, errorHdr});
      } else {
        this.setState({loading: false, profile, errors:null, errorHdr:null});
      }
    } catch (err) {
      console.error(err);
      this.setState({profile: null, errors:['Unknown error.', 'Please try again.'], loading: false, errorHdr});
    }
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
