import React, {Component} from 'react';
import ReactEcharts from 'echarts-for-react';  // or var ReactEcharts = require('echarts-for-react');
import echarts from 'echarts/lib/echarts';
import 'echarts/lib/chart/line';
import 'echarts/lib/chart/candlestick';

import Page from '../../components/Page';
import moment from 'moment';
import VError from 'verror';
import { Container, Message, Statistic, Icon, Button, Segment, Popup, Form } from 'semantic-ui-react';
import { DateRangePicker, SingleDatePicker, DayPickerRangeController } from 'react-dates';

import OptionsDropdown from '../../components/OptionsDropdown';
import RowCalendarPlot from '../../components/RowCalendarPlot';
import DivergingStackedBarPlot from '../../components/DivergingStackedBarPlot';

import { QUESTIONS_API, getHeaders } from '../../config'
import Data from '../../domain/Data';

export default class DashboardPage extends Component {
  constructor(props) {
    super(props);
    this.state={
      loading: false,
      startDate:moment().subtract(180,'d'),
      endDate:moment(),
      focusedInput:null,
      responseRates:[
      ],
      questionHistory:[],
    }
  }

  async componentDidMount(){
    await this.refreshData();
  }

  async refreshData(){
    const responseRates=[];
    const questionHistory=[];
    let usersSummary={};
    let data0={ }

    try {
      usersSummary = await Data.getUserSummary();
      console.log(usersSummary);
      const allData = await Data.getQuestionsSummary({startDate:this.state.startDate, endDate:this.state.endDate});
      const data = allData.company;
      data.forEach(r=>{
        const dt =  moment.utc(r.day);
        const N=parseInt(r.count);
        const avg=r.average/100.0;
        responseRates.push({
          date:dt.toDate(),
          value: avg
        })
        let cdata=data0[r.questionset.questions[0].category]||{data:[]};
        cdata.data.push([dt.format('YYYY/MM/DD'), Math.round(r.average),N,...r.dist]);
        data0[r.questionset.questions[0].category]=cdata;

        questionHistory.push({
          1: r.dist[0],
          2: r.dist[1],
          3: r.dist[2],
          4: r.dist[3],
          5: r.dist[4],
          N: N,
          avg:avg,
          Label: `${dt.format('YYYY-MM-DD')}`,
          category: r.questionset.questions[0].category,
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
    this.setState({responseRates, questionHistory, usersSummary, data0});
  }

  _getChartOptions=()=>{
    const {data0={}, responseRates=[]} = this.state;
    function calculateMA(dayCount, data) {
      var result = [];
      for (var i = 0, len = data.length; i < len; i++) {
          if (i < dayCount) {
              result.push('-');
              continue;
          }
          var sum = 0;
          for (var j = 0; j < dayCount; j++) {
              sum += data[i - j][1];
          }
          result.push([data[i-j][0], sum / dayCount]);
      }
      return result;
    }
    const options={
      title: {
          text: 'Trend',
          left: 0
      },
      tooltip: {
          trigger: 'axis',
          axisPointer: {
              type: 'cross'
          }
      },
      legend: {
          data: []
      },
      grid: {
          left: '10%',
          right: '10%',
          bottom: '15%'
      },
      xAxis: {
          type: 'time',
          scale: true,
          boundaryGap : false,
          axisLine: {onZero: false},
          splitLine: {show: false},
          splitNumber: 20,
          min: 'dataMin',
          max: 'dataMax'
      },
      yAxis: {
          scale: true,
          splitArea: {
              show: true
          }
      },
      dataZoom: [
          {
              type: 'inside',
              start: 0,
              end: 100
          },
          {
              show: true,
              type: 'slider',
              y: '90%',
              start: 0,
              end: 100
          }
      ],
      series: [],
    };
    Object.keys(data0).forEach((c)=>{
      options.legend.data.push(c);
      options.series.push({
        name: c,
        type: 'line',
        data: calculateMA(1,data0[c].data),
        smooth: true,
        lineStyle: {
          normal: {opacity: 0.5}
        },
      });
    });
    console.log(options);
    return options;
  }

  renderError() {
    const {error} = this.state;
    if (!error) return null;
    const {header='', errors=[]} = error;
    return <Message error header={header} list={errors} />
  }
  handleDateRangeChange=({startDate, endDate})=>{
    this.setState({startDate, endDate},async ()=>await this.refreshData());
  }
  
  renderCalendarInfo=()=>{
    const today=moment();
    return <div style={{display:'flex', alignItems:'center', justifyContent:'center'}}>
      This
      <Button.Group basic tiny>
        <Button onClick={()=>this.handleDateRangeChange({startDate:moment().startOf('week'), endDate: today})}>W</Button>
        <Button onClick={()=>this.handleDateRangeChange({startDate:moment().startOf('month'), endDate: today})}>M</Button>
        <Button onClick={()=>this.handleDateRangeChange({startDate:moment().startOf('quarter'), endDate: today})}>Q</Button>
        <Button onClick={()=>this.handleDateRangeChange({startDate:moment().startOf('year'), endDate: today})}>Y</Button>
      </Button.Group>
    </div>
  }
  render() {
    return <Page style={{padding:0}} loading={this.state.loading}>
      <Container>
        <br/>
        {this.renderError()}
        <Segment>
          <Form>
            <Form.Group widths='equal'>
              <Form.Field>
              <label>Date range</label>
              <DateRangePicker
                maxDate={moment()}
                minDate={moment().subtract(-1,'y')}
                startDate={this.state.startDate} // momentPropTypes.momentObj or null,
                startDateId="start_date_id" // PropTypes.string.isRequired,
                endDate={this.state.endDate} // momentPropTypes.momentObj or null,
                endDateId="end_date_id" // PropTypes.string.isRequired,
                onDatesChange={this.handleDateRangeChange} // PropTypes.func.isRequired,
                focusedInput={this.state.focusedInput} // PropTypes.oneOf([START_DATE, END_DATE]) or null,
                onFocusChange={focusedInput => this.setState({ focusedInput })} // PropTypes.func.isRequired,

                isOutsideRange={(d)=>{
                  return moment(d).isAfter(moment());
                }}
                displayFormat="D MMM YY"
                monthFormat="MMMM YYYY"
                orientation="horizontal"
                phrases={{
                  focusStartDate: 'Interact with the calendar and add the start date for your dashboard.',
                }}
                small noBorder
                calendarInfoPosition="top"
                numberOfMonths={1}
                renderCalendarInfo={this.renderCalendarInfo}
              />
              </Form.Field>

              <Form.Field>
                <label>Industry</label>
                <OptionsDropdown opname='industry' placeholder='All' value={this.state.industries} onChange={(e,{value})=>{
                  this.setState({industries: value});
                }} selection multiple clearable />
              </Form.Field>
            </Form.Group>
          </Form>
        </Segment>
        <span style={{fontSize: "1.5em"}}>Reponse Percentage:</span>
        <RowCalendarPlot data={this.state.responseRates}/>
        <br/>
        <Statistic.Group>
          <Statistic>
            <Statistic.Label>Registered Users</Statistic.Label>
            <Statistic.Value><Icon name='user'/> {this.state.usersSummary?this.state.usersSummary.registeredUsers:null}</Statistic.Value>
          </Statistic>
        </Statistic.Group>
        {this.replayButton()}
        <br/>
        <ReactEcharts 
          echarts={echarts}
          option={this._getChartOptions()}
          notMerge={true}
          lazyUpdate={true}
          // theme={"theme_name"}
          // onChartReady={this.onChartReadyCallback}
          // onEvents={EventsDict}
          opts={{}} 
          style={{height:'250px', width: '100%'}}
        />
        <br/>
        <span style={{fontSize: "1.5em"}}>Latest Questions:</span>
        <DivergingStackedBarPlot data={this.state.questionHistory} height={Math.max(360,this.state.questionHistory.length*50+60)}/>
      </Container>
    </Page>
  }
  replayButton() {
    return <Button onClick={async ()=>{
      try {
        const headers=getHeaders();
        headers["Content-type"] = "application/json";
        const response = await fetch(`/api/question/replay`, {
          headers,
          method: 'POST',
          body:JSON.stringify({})
        })
      } catch (ex) {
        console.log(ex);
      }
    }}>
    Replay</Button> 
  }
}
/* */