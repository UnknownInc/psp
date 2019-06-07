import React, {Component} from 'react';
import { Header, Tab, Segment } from 'semantic-ui-react';
import Page from '../../components/Page';
import OptionsEditor from './OptionsEditor';

class AdminSettingsPage extends Component {
  renderPanes() {
    return [
      { menuItem: 'Options', render: () => <Tab.Pane>
        <OptionsEditor/>
      </Tab.Pane> },
    ]
  }
  render(){
    return <Page>
      <Segment basic>
        <Header as='h1'>Settings</Header>
        <Tab panes={this.renderPanes()}/>
      </Segment>
    </Page>
  }
}

export default AdminSettingsPage;
