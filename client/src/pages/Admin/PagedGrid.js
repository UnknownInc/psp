import React,{Component} from 'react';
import { Segment, Table, Menu, Icon } from 'semantic-ui-react';

import VError from 'verror';

export default class PagedGrid extends Component {
  constructor(props) {
    super(props);
    this.state={
      loading: true,
      offset: 0,
      limit: this.props.limit||50,
      totalCount: this.props.totalCount||0,
      items: this.props.items||[],
    }
  }

  async componentDidMount() {
    await this.getData();
  }

  getData = async () => {
    let error=null;
    this.setState({loading: true, error})
    try{
      if (this.props.getData) {
        const {items, totalCount} = await this.props.getData(this.state.offset, this.state.limit);
        this.setState({items, totalCount});
      }
    } catch (err) {
      console.error('Failed loaded data for the paged grid', err);
      error={
        header: err.Message||'Unable to fetch data',
        messages: [VError.cause(err)]
      };
    } finally {
      this.setState({error, loading: false})
    }
  }

  render() {

    const {items=[], sortDirection, sortColumn}=this.state;
    const pages=[];
    let i=0;
    do{
      i++
      pages.push(i);
    }
    while(i<(this.state.totalCount/this.state.limit));

    const currentPage = Math.trunc((this.state.offset+1)/this.state.limit)+1;

    return <Segment>
      <span>Paged Grid</span>
      <Table compact celled selectable sortable striped>
        <Table.Header>

        </Table.Header>
        <Table.Body>

        </Table.Body>
        <Table.Footer>
          <Table.Row>
            <Table.HeaderCell colSpan='5'>
              <Menu floated='right' pagination>
                <Menu.Item as='a' icon disabled={currentPage===1}>
                  <Icon name='chevron left' />
                </Menu.Item>
                {pages.map(i=><Menu.Item key={i} as='a' 
                  active={currentPage===i}
                  onClick={e=>{
                    const pageNumber=i;
                    this.loadPage(pageNumber);
                  }} >{i}</Menu.Item>)}
                <Menu.Item as='a' icon disabled={currentPage===pages.length}>
                  <Icon name='chevron right' />
                </Menu.Item>
              </Menu>
            </Table.HeaderCell>
          </Table.Row>
        </Table.Footer>
      </Table>
    </Segment>
  }
}