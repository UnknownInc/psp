import React,{Component} from 'react';
import { Dropdown } from 'semantic-ui-react';
import Options from '../domain/Options';
import VError from 'verror';

export default class OptionsDropdown extends Component {
  constructor(props) {
    super(props);
    this.state = {
      options: [],
      loading: true,
    }
  }

  async componentDidMount() {
    let error=null;
    this.setState({loading: true, error})
    try {
      const opData = await Options.load({name: this.props.opname});

      const options = (opData.options||[]).map((o)=>{return {key:o, text:o, value:o}})

      this.setState({loading: false, options, error})
    } catch (err) {
      console.error('Failed loaded data for the option: ' + this.props.opname, err);
      error = {
        header: err.Message||'Unable to fetch the option: ' + this.props.opname,
        messages: [VError.cause(err)]
      };
    } finally {
      this.setState({error, loading: false})
    }
  }


  render() {
    const {options, loading} = this.state;
    const {opname, ...otherProps} = this.props;
    return <Dropdown {...otherProps}
      options={options} 
      disabled={loading}
      loading={loading} />
  }
}