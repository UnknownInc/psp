import React, {Component} from 'react';

import Page from '../../components/Page';
import moment from 'moment';

import { Menu,Container, Dropdown, Form, Header, Segment, Table, Icon, Checkbox, Button, Divider, Message, Popup, Responsive,Modal, FormButton, Tab, Comment, Label, Grid, Card, Item, Statistic, RevealContent } from 'semantic-ui-react';
import { getProfile , getHeaders} from '../../config';
import { isNullOrUndefined } from 'util';

import { Sparklines, SparklinesLine,SparklinesSpots,SparklinesReferenceLine } from 'react-sparklines';
/*
import Plot from 'react-plotly.js';
<Plot
  data={[
    {
      
      x: ['2019-01-01', '2019-02-01', '2019-03-01'],
      y: [2, 3.5, 4.1],
      type: 'scatter',
      mode: 'lines+markers',
      fill:'tozeroy',
      line:{color: 'rgb(8, 159,255)', width: 2},
      marker: {
        color: 'white',
        size: 8,
        line: {
          color: 'rgb(8, 159,255)',
          width: 2
        }
      }
    }
  ]}
  config={{responsive:true}}
  layout={{
    legend: false,
    autosize:true,
    width: '100%', height: '100%',
    title: {
      text: 'Culture',
      font:{
        family:'fnlight',
        size:20,
        color: 'lightgrey'
      },
      xref: 'paper',
      x: 0.005,
    },
    yaxis:{
      showticklabels:false,
      showgrid: false,
    },
    xaxis:{
      nticks:3,
      showgrid: false,
      range: ['2019-01-01', '2019-03-02'],
      type:'date'
    }
  }}
/> */

import SemanticDatepicker from 'react-semantic-ui-datepickers';
import 'react-semantic-ui-datepickers/dist/react-semantic-ui-datepickers.css';

const intervalOptions =[
  {key: 'last_week', text:'Last week', value:'7'},
  {key: 'last_month', text:'Last month', value:'30'},
  {key: 'last_quarter', text:'Last quarter', value:'120'},
  {key: 'last_6month', text:'Last 6 months', value:'180'},
  {key: 'last_year', text:'Last year', value:'365'},
]

const categories = [
  {key:"culture", text:"Culture", value:"Culture"},
  {key:"engagement", text:"Engagement", value:"Engagement"},
  {key:"leaders", text:"Leaders", value:"Leaders"},
  {key:"Manager", text:"Manager", value:"Manager"},
  {key:"not_categorized", text:"Not Categorized", value:"Not Categorized"},
  {key:"team", text:"Team", value:"Team"},
  {key:"work_environment", text:"Work Environment", value:"Work Environment"}
];

class ReportsPage extends Component {
  constructor(props) {
    super(props);
    this.state={
      loading: true,
      activeItem: 'overview',
      recent:[],
      selectedInterval:intervalOptions[1]
    }
  }

  async componentDidMount(){
    const errorHdr = 'Unable to retrive the user profile.';
    try {
      const {profile, errors} = await getProfile()
      if (errors.length>0) {
        return this.setState({loading: false, profile, errors:errors, errorHdr});
      } 
      const headers = getHeaders();
      const response = await fetch(`/api/team?user=${profile._id}`, {headers})
      if (!response.ok){
        return this.setState({errors:['Unable to retrive teams information.', 'Please try again.'], loading: false, errorHdr}); 
      }

      const teams=await response.json();
      const selectedTeam = teams.length>0?teams[0]:null;
      this.setState({teams, selectedTeam, loading: false, profile, errors:null, errorHdr:null})
      this.handleFilterChange()
    } catch (err) {
      console.error(err);
      this.setState({profile: null, errors:['Unknown error.', 'Please try again.'], loading: false, errorHdr});
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
    const {selectedTeam, selectedInterval}=this.state;
    if (!isNullOrUndefined(selectedTeam)){
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
    this.setState({selectedTeam: this.state.teams.find(t=>t.name===data.value)})
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
    const {selectedTeam={}, teams=[], selectedInterval={}, filtering} = this.state;
    const teamOptions=teams.map(t=>{return {key:t.name, text:t.name, value:t.name}})
    return <Segment basic loading={filtering}>
      <Form>
        <Form.Group inline>
          <Form.Select options={teamOptions} label='Team'  value={selectedTeam.name} onChange={this.handleTeamSelection}/>
          <Form.Select options={[]} label='Manager'  value={null} onChange={this.handleManagerSelection}/>
           
          <Form.Select options={intervalOptions} label='interval' value={selectedInterval.value} onChange={this.handleIntervalChange} />
          
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
    let {summary=null,recent=[]} = this.state;
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
              {category.map(d=>this.renderChart(d.category,d.values, d.companyAvg))}
          </Card.Group>
        </div>
        <div>
          <br/><br/><br/>
          <Grid columns={2} stackable>
            <Grid.Column>
  <Header as={'h3'} color='grey'>Top questions <small><Popup trigger={<Icon name='question circle outline'/>} content={'The questions that had the most favourable responses from the team.'}/></small></Header>
              <Item.Group>
                {top.map(i=>this.renderMiniCard(i))}
              </Item.Group>
            </Grid.Column>
            <Grid.Column>
              <Header as={'h3'} color='grey'>Bottom questions <small><Popup trigger={<Icon name='question circle outline'/>} content={'The questions that had the least favourable responses from the team.'}/></small></Header>
              <Item.Group>
                {bottom.map(i=>this.renderMiniCard(i))}
              </Item.Group>
            </Grid.Column>
          </Grid>
          <Header as={'h3'} color='grey'>Recent questions <small><Popup trigger={<Icon name='question circle outline'/>} content={'Recent questions in reverse chronological order.'}/></small></Header>
          <Item.Group>
            {recent.map(i=>this.renderMiniCard(i))}
          </Item.Group>
        </div>
      </Container>
    </Page>
  }
}

export default ReportsPage;
