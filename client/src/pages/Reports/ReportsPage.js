import React, {Component} from 'react';

import Page from '../../components/Page';
import moment from 'moment';
import VError from 'verror';
import { Menu,Container, Form, Header, Segment, Icon, Button, Message, Popup, Grid, Card, Item, Statistic } from 'semantic-ui-react';
import { getProfile} from '../../config';

import { Sparklines, SparklinesLine,SparklinesSpots,SparklinesReferenceLine } from 'react-sparklines';
import 'react-semantic-ui-datepickers/dist/react-semantic-ui-datepickers.css';
import Team from '../../domain/Team';
import OptionsDropdown from '../../components/OptionsDropdown';

const intervalOptions =[
  {key: 'last_week', text:'Last week', value:'7'},
  {key: 'last_month', text:'Last month', value:'30'},
  {key: 'last_quarter', text:'Last quarter', value:'120'},
  {key: 'last_6month', text:'Last 6 months', value:'180'},
  {key: 'last_year', text:'Last year', value:'365'},
]


class ReportsPage extends Component {
  constructor(props) {
    super(props);
    this.state={
      loading: true,
      userid: this.props.userid,
      activeItem: 'overview',
      recent:[],
      selectedInterval:intervalOptions[1]
    }
  }

  async componentDidMount(){
    this.setState({loading: true})
    let error = null;
    let teams =[];
    try {
      console.log(this.props.location)
      let userid = this.state.userid;
      if (!userid) {
        const {profile} = await getProfile()
        userid = profile._id;
      }
      teams=await Team.load({userid})
    }catch (err) {
      console.error(err);
      error = {
        header: err.message,
        cause: VError.cause(err),
      }
    } finally {
      this.setState({loading: false, teams, error},()=>{
        this.handleFilterChange()
      })
    }
  }

  getRandomValues(maxcount){
    const values=[];
    const s=Math.random()*5;
    const e=s+1+Math.random()*maxcount/4;
    for(let i=s;i<e;i++){
      let d=Math.random()>.5?0.5:-0.5
      let v=3.5+(Math.random()*d)+2*Math.sin(i/6+0.35)+Math.sin(i-.75)+Math.sin(i/2)
      v=(v-0.65)/6.7*5;
      /*if (lastVal<0.5) {lastVal=1}
      if (lastVal>4.9) {lastVal=4.5} */
      values.push(v)
    }
    return values;
  }
  handleFilterChange = async ()=>{
    const {selectedInterval}=this.state;
    if (true){
      this.setState({filtering:true, summary:{aggregates:{category:[],top:[], bottom:[]}}});
      setTimeout(()=>{
        const summary={ aggregates:{category:[], top:[], bottom:[]}};
        const categoryAggregates=[
          {category:'Engagement',values:this.getRandomValues(selectedInterval.value), companyAvg:1+Math.random()*4},
          {category:'Culture',values:this.getRandomValues(selectedInterval.value), companyAvg:1+Math.random()*4.0},
          {category:'Manager',values:this.getRandomValues(selectedInterval.value), companyAvg:1+Math.random()*4.0},
          {category:'Leaders',values:this.getRandomValues(selectedInterval.value), companyAvg:1+Math.random()*4.0}
        ]
        summary.aggregates.category=categoryAggregates;
        summary.aggregates.top=[
          {question:"Do your teammates know how to keep Sapient & Sapient's Clients intellectual property and data safe?", category:'Work Environment', date:new Date(2019,1,9), data:{companyAvg:3.5, average: 3.6}},
          {question:"Do you find your work to be a positive challenge?", category:'Engagement', date:new Date(2019,0,23), data:{companyAvg:4.0, average: 3.9}},
          {question:"Does working at Sapient motivate you to exceed expectations at work?", category:'Culture', date:new Date(2019,2,1), data:{companyAvg:3.8, average: 3.6}},
        ]
        summary.aggregates.bottom=[
          {question:"Are you planning on looking for a new job in the near future?", category:'Engagement', date:new Date(2019,1,9), data:{companyAvg:3.5, average: 2.8}},
          {question:"How often do you get to decide the best way to get your work done?", category:'Manager', date:new Date(2019,0,23), data:{companyAvg:3.4, average: 2.0}},
          {question:"When my leader delivers feedback, they first seek to understand.", category:'Leaders', date:new Date(2019,0,5), data:{companyAvg:3.7, average: 2.1}},
        ]
        this.setState({filtering: false, summary})
      }, 1000)
    }
  }

  handleTeamSelection=(e,data)=>{
    // const selectedTeams = this.state.teams.filter(t=> (data.value.indexOf(t.name)!==-1));
    // this.setState({selectedTeams})
    this.setState({selectedTeams: data.value});
  }

  handleManagerSelection=(e,data)=>{
    this.setState({selectedManagers: data.value});
  }

  handleIntervalChange=(e,data)=>{
    console.log(data);
    this.setState({selectedInterval: intervalOptions.find(i=>i.value===data.value)})
  }

  renderError() {
    const {errorHdr, errors=[]} = this.state;
    if (!errorHdr) return null
    return <Message error header={errorHdr} list={errors} />
  }

  renderFilterBar(){
    const {selectedTeams=[], selectedManagers=[], teams=[], selectedInterval={}, filtering, teamtypes=[]} = this.state;
    const mteams=teams
      .filter(t=>(teamtypes.length===0 || teamtypes.indexOf(t.type)!==-1))

    const teamOptions=mteams
      .map(t=>({key:t.name, text:t.name, value:t}))

    const addedEmails=[]
    const managers = [];
    selectedTeams.forEach(t=>{
      t.children.forEach(u=>{
        if (addedEmails.indexOf(u.email)) {
          addedEmails.push(u.email);
          managers.push({key: u.email, text: u.name, value: u});
        }
      });
    })

    return <Segment basic loading={filtering}>
      <Form>
        <Form.Group inline>
          <Form.Field>
            <label>Team Type</label>
            <OptionsDropdown opname='teamtype' placeholder='All' value={teamtypes} onChange={(e,{value})=>{
              this.setState({teamtypes: value});
            }} selection multiple clearable />
          </Form.Field>
          <Form.Select options={teamOptions} label='Team Name' placeholder='All'
            value={selectedTeams} onChange={this.handleTeamSelection} clearable multiple />
          <Form.Select options={[...managers]} label='Team Leader' placeholder='All'
            value={selectedManagers}  onChange={this.handleManagerSelection} clearable multiple />
           
          <Form.Select options={intervalOptions} label='Duration' value={selectedInterval.value} onChange={this.handleIntervalChange} />
          
          <Button basic color='blue' animated='fade' onClick={this.handleFilterChange}>
            <Button.Content hidden>Filter</Button.Content>
            <Button.Content visible>
              <Icon name='filter' />
            </Button.Content>
          </Button>
        </Form.Group>
      </Form>
    </Segment>
  }

  renderSecondaryMenu(){
    const {activeItem} = this.state;
    return <Menu secondary pointing borderless>
      <Menu.Item name='overview' active={activeItem === 'overview'} onClick={this.handleItemClick} />
    </Menu> 
  }

  getColor(avg,cavg){
    let color='grey';
    const diff=avg-cavg;
    if (diff<=-25) { color='red'}
    if (diff>=-10) {color='green'}
    if (diff>0) {color='blue'} 
    return color;
  }
  renderChart(category, data, cavg) {
    const avg=data.reduce((s,d)=>s+d,0)/data.length;
    const score=Math.trunc(avg*20.0);
    const cscore=Math.trunc(cavg*20.0);
    const changePercent=Math.trunc( (data[data.length-1]-data[0])*20.0);
    let color=this.getColor(score,cscore);
    return <Card>
      <Card.Content>
        <Button circular floated='right' color={color} basic style={{
          width:'48px',height: '48px',
          borderWidth: '4px', borderStyle: 'solid', padding: 0}}>{score}%</Button>
        {/* <div style={{fontSize: 18, float:'right', fontWeight:'bold', borderRadius:'50%', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center',
        borderWidth:4, borderColor:color, borderStyle:'solid', width:'48px', height:'48px'}}>{score}%</div> */}
        <Card.Header>{category}</Card.Header>
        <Card.Meta>company avg: {cscore}%</Card.Meta>
        <Card.Description>
          <div style={{position:'relative', height:150}}>
            <div style={{position:'absolute', bottom:0, left:0,right:0}}>
              <Sparklines data={data} height={150} min={0} max={5}>
                <SparklinesLine color="#089fff" />
                <SparklinesSpots size={4} style={{ stroke: "#089fff", strokeWidth: 3, fill: "white" }}/>
                <SparklinesReferenceLine type="avg" />
              </Sparklines>
            </div>
            <div style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
              <Header as={'h3'}>{changePercent}%<Icon name={changePercent>=0?'triangle up':'triangle down'} color={changePercent<0?'red':'green'}/></Header>
              {/* <span>Jan 1 - Mar 1</span> */}
            </div>
          </div> 
        </Card.Description>
      </Card.Content>
    </Card>
  }

  renderMiniCard(item){
    if (!item) return null;
    const score=Math.trunc(item.data.average*20.0);
    const cscore=Math.trunc(item.data.companyAvg*20.0);
    let color=this.getColor(score,cscore);
    return <Item>
      <div style={{minWidth:'96px',height:'108px', color:'white', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}
        className={'ui inverted '+color+' menu'}>
        <Statistic size='tiny'>
          <Statistic.Value>{score}%</Statistic.Value>
          <Statistic.Label>company: {cscore}%</Statistic.Label>
        </Statistic>
      </div>
      <Item.Content style={{paddingLeft:'1em', backgroundColor:'white', maxHeight:'108px'}}>
        <Item.Extra>{moment(item.date).format('dddd,MMMM Do')}</Item.Extra>
        <Item.Header>{item.question}</Item.Header>
        <Item.Description>{item.category}</Item.Description>
      </Item.Content>
    </Item>
  }

  render(){
    let {summary=null,recent=[], teams=[]} = this.state;
    if(summary===null) {
      summary={aggregates:{category:[], top:[], bottom:[]}}
    }
    const {category, top, bottom} = summary.aggregates;

    return <Page style={{padding:0}} loading={this.state.loading}>
      <Container>
        <Segment style={{padding:0}}>
          {this.renderError()}
          {this.renderFilterBar()}
          {this.renderSecondaryMenu()}
        </Segment>
        {teams.length===0?(
            <h3>You need to be a team leader with more than 3 people to see some reports.</h3>
          ):(<div>
          <div>
            <br/>
            <div style={{display:'flex', justifyContent:'space-between'}}>
              <Header as={'h3'} color='grey' >Category averages</Header>
              <div >
                <Popup trigger={<Icon name='square full' color='red'/>} content={'Critically Below company average'} position='top center'/>
                <Popup trigger={<Icon name='square full' color='grey'/>} content={'Below company average'} position='top center'/>
                <Popup trigger={<Icon name='square full' color='green'/>} content={'Around company average'} position='top center'/>
                <Popup trigger={<Icon name='square full' color='blue'/>} content={'Better than company average'} position='top center'/>
              </div>
            </div>
            <Card.Group centered itemsPerRow={4} doubling>
                {
                  category.length===0?(
                    <h4><Icon name='frown outline'/> Not enough data to report. Change the filters or Check after few days.</h4>
                  ):(
                    category.map(d=>this.renderChart(d.category,d.values, d.companyAvg))
                  )
                }
            </Card.Group>
          </div>
          <div>
            <br/><br/><br/>
            <Grid columns={2} stackable>
              <Grid.Column>
    <Header as={'h3'} color='grey'>Top questions <small><Popup trigger={<Icon name='question circle outline'/>} content={'The questions that had the most favourable responses from the team.'}/></small></Header>
                <Item.Group>
                  {
                    top.length===0?(
                      <h4><Icon name='frown outline'/> Not enough data to report.</h4>
                    ):top.map(i=>this.renderMiniCard(i))
                  }
                </Item.Group>
              </Grid.Column>
              <Grid.Column>
                <Header as={'h3'} color='grey'>Bottom questions <small><Popup trigger={<Icon name='question circle outline'/>} content={'The questions that had the least favourable responses from the team.'}/></small></Header>
                <Item.Group>
                  {
                    bottom.length===0?(
                      <h4><Icon name='frown outline'/> Not enough data to report.</h4>
                    ):bottom.map(i=>this.renderMiniCard(i))
                  }
                </Item.Group>
              </Grid.Column>
            </Grid>
            <Header as={'h3'} color='grey'>Recent questions <small><Popup trigger={<Icon name='question circle outline'/>} content={'Recent questions in reverse chronological order.'}/></small></Header>
            <Item.Group>
              {
                recent.length===0?(
                      <h4><Icon name='frown outline'/> Not enough data to report.</h4>
                    ):recent.map(i=>this.renderMiniCard(i))
              }
            </Item.Group>
          </div>
        </div>)}
      </Container>
    </Page>
  }
}

export default ReportsPage;
