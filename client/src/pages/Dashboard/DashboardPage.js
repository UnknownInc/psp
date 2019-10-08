import React, {Component} from 'react';

import Page from '../../components/Page';
import moment from 'moment';
import VError from 'verror';
import { Container, Message, Statistic, Icon, Button } from 'semantic-ui-react';
import RowCalendarPlot from '../../components/RowCalendarPlot';
import DivergingStackedBarPlot from '../../components/DivergingStackedBarPlot';

import { QUESTIONS_API, getHeaders } from '../../config'
import Data from '../../domain/Data';

export default class DashboardPage extends Component {
  constructor(props) {
    super(props);
    this.state={
      loading: false,
      responseRates:[
      ],
      questionHistory:[],
    }
  }

  async componentDidMount(){
    const responseRates=[];
    const questionHistory=[];
    let usersSummary={};
    const today=moment();
    let day=today.startOf('year').add(1,'day');

    // do{
    //   responseRates.push({date:day.toDate(), value:(Math.random())});
    //   day=day.add(1, 'day');
    // } while(day.isBefore(today))

    try {
      usersSummary = await Data.getUserSummary();
      console.log(usersSummary);

      const data = await Data.getQuestionsSummary({startDate:day});
      data.forEach(r=>{
        const dt =  moment.utc(r.day);
        const N=parseInt(r.count);
        const avg=r.average/100.0;
        responseRates.push({
          date:dt.toDate(),
          value: avg
        })

        questionHistory.push({
          1: r.dist[0],
          2: r.dist[1],
          3: r.dist[2],
          4: r.dist[3],
          5: r.dist[4],
          N: N,
          avg:avg,
          Label: `${dt.format('YYYY-MM-DD')}`,
          text: r.questionset.questions[0].question,
          options: r.questionset.questions[0].options.reverse(),
        });
      })
    } catch (err) {
      console.error(err);
      this.setState({
        error: {
          header: err.message,
          cause: VError.cause(err),
        }
      })
    }


    // for(let i=0;i<10;i++) {
    //   let n=200+ Math.round(Math.random()*1000);
    //   let a = Math.round(n/20 + Math.random()*n/2 );
    //   let b = Math.round(n/20 + Math.random()*(n/2) );
    //   let c = Math.round(n/20 + Math.random()*(n/2) );
    //   let d = Math.round(n/20 + Math.random()*(n/2) );
    //   let e = Math.round(n/20 + Math.random()*(n/2) );
    //   n=a+b+c+d+e;
    //   questionHistory.push({
    //     1: a,
    //     2: b,
    //     3: c,
    //     4: d,
    //     5: e,
    //     N: n,
    //     Label: `Question ${i}`
    //   })
    // }
    this.setState({responseRates, questionHistory, usersSummary});
  }

  renderError() {
    const {error} = this.state;
    if (!error) return null;
    const {header='', errors=[]} = error;
    return <Message error header={header} list={errors} />
  }

  render() {
    return <Page style={{padding:0}} loading={this.state.loading}>
      <Container>
        <br/>
        {this.renderError()}
        <span style={{fontSize: "1.5em"}}>Reponse Percentage:</span>
        <RowCalendarPlot data={this.state.responseRates}/>
        <br/>
        <Statistic.Group>
          <Statistic>
            <Statistic.Label>Registered Users</Statistic.Label>
            <Statistic.Value><Icon name='user'/> {this.state.usersSummary?this.state.usersSummary.registeredUsers:null}</Statistic.Value>
          </Statistic>
        </Statistic.Group>
        <br/>
        <Button onClick={async ()=>{
          
            try {
              const headers=getHeaders();
              headers["Content-type"] = "application/json";
              const response = await fetch(`/api/question/replay`, {
                headers,
                method: 'POST',
                body:JSON.stringify({
                })
              })
            } catch (ex) {
              console.log(ex);
            }
        }}>Replay</Button>
        <span style={{fontSize: "1.5em"}}>Latest Questions:</span>
        <DivergingStackedBarPlot data={this.state.questionHistory} height={Math.max(300,this.state.questionHistory.length*50+60)}/>
      </Container>
    </Page>
  }
}