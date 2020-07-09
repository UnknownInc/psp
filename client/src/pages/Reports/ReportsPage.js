import React, {Component} from 'react';

import Page from '../../components/Page';
import moment from 'moment';
import VError from 'verror';
import { Checkbox,Menu,Container, Form, Header, Segment, Icon,Label, Button, Message, Popup, Grid, Card, Item, Statistic } from 'semantic-ui-react';
import { getProfile} from '../../config';

import { Sparklines, SparklinesLine,SparklinesSpots,SparklinesReferenceLine } from 'react-sparklines';
import 'react-semantic-ui-datepickers/dist/react-semantic-ui-datepickers.css';
import Team from '../../domain/Team';
import OptionsDropdown from '../../components/OptionsDropdown';
import Data from '../../domain/Data';
import User from '../../domain/User';

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
      selectedInterval:intervalOptions[1],
      onlyDirects:true
    }
  }

  async componentDidMount(){
    this.setState({loading: true})
    let error = null;
    let userid;
    let teams =[];
    try {
      const params = new URLSearchParams(this.props.location.search); 
      const email = params.get('e');
      if (email) {
        try{
          const u = await User.getByEmail(email);
          userid = u._id;
        } catch(e) {
          console.error(e);
          userid = this.state.userid;
        }
      } else {
        userid = this.state.userid;
      }
      if (!userid) {
        const {profile} = await getProfile()
        userid = profile._id;
      }
      teams=await Team.load({userid})
      console.dir(teams);
    }catch (err) {
      console.error(err);
      error = {
        header: err.message,
        cause: VError.cause(err),
      }
    } finally {
      this.setState({loading: false, teams, userid, error},()=>{
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
    const {selectedInterval, teamtypes=[], }=this.state;
    if (true){
      this.setState({filtering:true, recent:[], summary:{aggregates:{category:[],top:[], bottom:[]}}});
      setImmediate(async ()=>{
        const startDate=moment().subtract('d', selectedInterval.value);
        const endDate=moment()
        const allData = await Data.getTeamQuestionsSummary({uid: this.state.userid ,startDate, endDate,
          teamType:teamtypes.join(',')});
        const questions = allData.questions;

        const summary={ aggregates:{category:[], top:[], bottom:[]}};
        const categoryAggregates=[
          // {category:'Engagement',values:this.getRandomValues(selectedInterval.value), companyAvg:1+Math.random()*4},
          // {category:'Culture',values:this.getRandomValues(selectedInterval.value), companyAvg:1+Math.random()*4.0},
          // {category:'Manager',values:this.getRandomValues(selectedInterval.value), companyAvg:1+Math.random()*4.0},
          // {category:'Leaders',values:this.getRandomValues(selectedInterval.value), companyAvg:1+Math.random()*4.0}
        ]
        summary.aggregates.category=categoryAggregates;
        summary.aggregates.top=[]; summary.aggregates.bottom=[];

        const cats={};
        for(let i=0;i<allData.scores.length;++i){
          const itm=allData.scores[i];
          if (!cats[itm.category]) {
            cats[itm.category]={category: itm.category, values:[], companyAvg:0, companyValues:[]};
            categoryAggregates.push(cats[itm.category]);
          }
          cats[itm.category].values.push(itm.average/20);
          itm.qi=questions.filter(q=>q.qsid===itm.eid)[0];
          cats[itm.category].companyValues.push(itm.qi.average/20);
        }

        let sortedQlist=[];
        sortedQlist = allData.scores.sort((a,b)=>(b.average - a.average));
        for(let i=0;i<Math.min(sortedQlist.length,3);i++) {
          const itm=sortedQlist[i];
          const qi=itm.qi;//questions.filter(q=>q.qsid===itm.eid)[0];
          const q=qi.questionset.questions[0];
          summary.aggregates.top.push({
            question: q.question,
            options:[...q.options,{value:'IDWA'}],
            category: q.category,
            count: itm.count,
            dist: [...itm.dist].reverse(),
            date:qi.day,
            data:{ average: itm.average/20, companyAvg: qi.average/20} 
          })
        }

        for(let i=0;i<Math.min(sortedQlist.length,3);i++) {
          const itm=sortedQlist[sortedQlist.length-i-1];
          if (!itm) continue;
          const qi=itm.qi;//questions.filter(q=>q.qsid===itm.eid)[0];
          const q=qi.questionset.questions[0];
          summary.aggregates.bottom.push({
            question: q.question,
            options:[...q.options,{value:'IDWA'}],
            category: q.category,
            count: itm.count,
            dist: [...itm.dist].reverse(),
            date:qi.day,
            data:{ average: itm.average/20, companyAvg: qi.average/20} 
          })
        }

        sortedQlist = allData.scores.sort((a,b)=> moment(a.interval).unix() - moment(b.interval).unix()); 
        const recent=[];
        for(let i=sortedQlist.length-1;i>=0;i--) {
          const itm = sortedQlist[i]; //sortedQlist.filter(itm=>itm.eid===qi.qsid)[0];
          const qi=itm.qi;// questions[i];
          const q=qi.questionset.questions[0];
          recent.push({
            question: q.question,
            options:[...q.options,{value:'IDWA'}],
            category: q.category,
            count: itm.count,
            dist: [...itm.dist].reverse(),
            date:qi.day,
            data:{ average: itm.average/20, companyAvg: qi.average/20}
          })
        }
        this.setState({filtering: false, summary, recent})
      });
    }
  }

  handleTeamSelection=(_e,data)=>{
    // const selectedTeams = this.state.teams.filter(t=> (data.value.indexOf(t.name)!==-1));
    // this.setState({selectedTeams})
    this.setState({selectedTeams: data.value});
  }

  handleManagerSelection=(_e,data)=>{
    this.setState({selectedManagers: data.value});
  }

  handleIntervalChange=(_e,data)=>{
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
          let name=(u.name||'').trim();
          if (name===''){
            let p=u.email.split('@');
            name=p[0].replace('.',' ');
          }
          managers.push({key: u.email, text: name, value: u});
        }
      });
    })

    return <Segment basic loading={filtering}>
      <Form>
        <Form.Group widths='equal'>
          <Form.Field>
            <label>Team Type</label>
            <OptionsDropdown opname='teamtype' placeholder='All' value={teamtypes} onChange={(_e,{value})=>{
              this.setState({teamtypes: value});
            }} selection multiple clearable />
          </Form.Field>
          <Form.Select options={teamOptions} label='Team Name' placeholder='All'
            value={selectedTeams} onChange={this.handleTeamSelection} clearable multiple />
          <Form.Select options={[...managers]} label='Team Leader' placeholder='All'
            value={selectedManagers}  onChange={this.handleManagerSelection} clearable multiple />
           
          <Form.Select options={intervalOptions} label='Duration' value={selectedInterval.value} onChange={this.handleIntervalChange} />
          
        </Form.Group>
        <Form.Group>
          <Form.Field width={4}>
            <label></label>
            <Checkbox toggle label='Only Directs' checked={this.state.onlyDirects} onChange={(_e,{checked})=>this.setState({onlyDirects:checked})}/>
          </Form.Field>
          <Form.Field width={12}>
            <Button basic color='blue' onClick={this.handleFilterChange} fluid
              content='Filter' icon='filter'/>
          </Form.Field>
        </Form.Group>
      </Form>
    </Segment>
  }

  handleItemClick = (itemId)=>{
    this.setState({activeItem:itemId});
  }
  renderSecondaryMenu(){
    const {activeItem, teams=[]} = this.state;
    return <Menu secondary pointing borderless>
      <Menu.Item name='overview' active={activeItem === 'overview'} onClick={()=>this.handleItemClick('overview')} />

      {/* teams.map((t)=>{
        return <Menu.Item name={t.name} key={t._id} active={activeItem === t._id} onClick={()=>this.handleItemClick(t._id)} /> 
      })*/}
    </Menu> 
  }

  getColor(avg,cavg){
    let color='';
    const diff=avg-cavg;
    if (diff>0) {color='blue'} 
    else if (diff>=-10) {color='green'}
    else if (diff>=-20) { color='grey'}
    else if (diff>=-30) { color='yellow'}
    else { color='red'}
    return color;
  }
  renderChart(category, data, cdata) {
    const avg=data.reduce((s,d)=>s+d,0)/data.length;
    const cavg=cdata.reduce((s,d)=>s+d,0)/cdata.length;
    const score=Math.trunc(avg*20.0);
    const cscore=Math.trunc(cavg*20.0);
    const changePercent=Math.trunc( (data[data.length-1]-data[0])*20.0);
    let color=this.getColor(score,cscore);
    return <Card key={category}>
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

  renderMiniCard(item, i, icons=true){
    if (!item) return null;
    const score=Math.trunc(item.data.average*20.0);
    const cscore=Math.trunc(item.data.companyAvg*20.0);
    let color=this.getColor(score,cscore);
    const cmap=['blue','green','grey','yellow','red',''];
    return <Item key={i}>
      <div style={{minWidth:'96px',height:'108px', color:'white', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}
        className={`ui inverted ${color} menu`}>
        <Statistic size='tiny'>
          <Statistic.Value><strong>{score}</strong>%</Statistic.Value>
          <Statistic.Label><br/><small>company: {cscore}%</small></Statistic.Label>
        </Statistic>
      </div>
      <Item.Content style={{paddingLeft:'1em', backgroundColor:'white', maxHeight:'108px'}}>
        <Item.Extra>{moment(item.date).format('dddd,MMMM Do')}&nbsp;&nbsp;&nbsp;<strong>{item.category}</strong>({item.count})</Item.Extra>
        <Item.Header><br/>{item.question}</Item.Header>
        <Item.Description>
            <Label.Group size='mini' circular={icons}>
              {item.options.map((o,i)=>{
                return icons?<Popup  key={i}
                  trigger={<Label color={cmap[ Math.round(i*6.0/item.options.length)]}>{item.dist[i]}</Label>}
                  content={o.value}
                />:<Label color={cmap[ Math.round(i*6.0/item.options.length)]} basic key={i}>
                  {o.value}
                  <Label.Detail>({item.dist[i]})</Label.Detail>
                </Label>
              })}
            </Label.Group>
        </Item.Description>
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
                <Popup trigger={<Icon name='square full' color='red'/>} content={'Critically Below company average'} position='top right'/>
                <Popup trigger={<Icon name='square full' color='yellow'/>} content={'Well Below company average'} position='top right'/>
                <Popup trigger={<Icon name='square full' color='grey'/>} content={'Below company average'} position='top right'/>
                <Popup trigger={<Icon name='square full' color='green'/>} content={'Around company average'} position='top right'/>
                <Popup trigger={<Icon name='square full' color='blue'/>} content={'Better than company average'} position='top right'/>
              </div>
            </div>
            <Card.Group centered itemsPerRow={4} doubling>
                {
                  category.length===0?(
                    <h4><Icon name='frown outline'/> Not enough data to report. Change the filters or Check after few days.</h4>
                  ):(
                    category.map(d=>this.renderChart(d.category,d.values, d.companyValues))
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
                    ):top.map((item,i)=>this.renderMiniCard(item, i))
                  }
                </Item.Group>
              </Grid.Column>
              <Grid.Column>
                <Header as={'h3'} color='grey'>Bottom questions <small><Popup trigger={<Icon name='question circle outline'/>} content={'The questions that had the least favourable responses from the team.'}/></small></Header>
                <Item.Group>
                  {
                    bottom.length===0?(
                      <h4><Icon name='frown outline'/> Not enough data to report.</h4>
                    ):bottom.map((item,i)=>this.renderMiniCard(item, i))
                  }
                </Item.Group>
              </Grid.Column>
            </Grid>
            <Header as={'h3'} color='grey'>Recent questions <small><Popup trigger={<Icon name='question circle outline'/>} content={'Recent questions in reverse chronological order.'}/></small></Header>
            <Item.Group>
              {
                recent.length===0?(
                      <h4><Icon name='frown outline'/> Not enough data to report.</h4>
                    ):recent.map((item,i)=>this.renderMiniCard(item, i, false))
              }
            </Item.Group>
          </div>
        </div>)}
      </Container>
    </Page>
  }
}

export default ReportsPage;
