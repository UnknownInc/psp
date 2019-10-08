import React, { Component } from 'react'
import { QUESTIONS_API, getHeaders } from '../../config'

import './QuestionCard.css';
import { Loader } from 'semantic-ui-react';
import moment from 'moment';

export default class QuestionCard extends Component {
  state ={
    loading: true,
    submiting: false,
    submitted: false,
    selectedOption:null,
    error:null,
    isNotLoggedIn: true
  }

  async componentDidMount(){
    await this.getTodaysQuestion();
  }

  getTodaysQuestion=async()=>{
    try {
      const headers=getHeaders();
      const response = await fetch(`${QUESTIONS_API}/api/question/current`, {headers})

      if (response.status===401) {
        this.setState({isNotLoggedIn: true, loading: false});
        return 
      }
      
      if (response.status===404) {
        this.setState({loading: false, submitted: true})
        return
      }

      if (response.status>=500) {
        this.setState({error: "Oops! encountering some technical difficulties, Please visit after sometime.", loading: false});
        return
      }

      const qs = await response.json() 
     
      const lid = window.localStorage.getItem('lastResponseQs'); 

      //window.localStorage.setItem('lastResponseDate',moment().utc().startOf('day').format('YYYY-MM-DD'));
      if (qs._id && lid!==qs._id) {
        if (window.interop) {
          window.interop.sendMessage(`HasQuestions:${qs._id}:${qs.questions.length}`);
        }
        this.setState({loading: false, query: qs.questions[0], qs})
      } else {
        if (window.interop) {
          window.interop.sendMessage(`FinishedQuestions:${qs._id}`);
        }
        
        let today = new Date();
        let tomorrow = new Date();
        tomorrow.setDate(today.getDate()+1);
        tomorrow.setHours(8,0,0)
        let timeinms=tomorrow.getTime()-today.getTime();
        setTimeout(async ()=>{
          await this.getTodaysQuestion();
        }, timeinms)
        this.setState({loading: false, submitted: true})
      }
    }
    catch(err) {
      console.error(err);
    }
  }

  submitAnswer = async (option)=>{
    this.setState({submiting: true});

    try {
      const headers=getHeaders();
      headers["Content-type"] = "application/json";
      const response = await fetch(`/api/question/submit`, {
        headers,
        method: 'POST',
        body:JSON.stringify({
          questionSet:this.state.qs._id,
          question:this.state.query._id,
          response: option,
          date: moment().toISOString(true)
        })
      })

      if (!response.ok && response.status!==403) {
        this.setState({submitted: false, submiting: false})
        return 
      }
      window.localStorage.setItem('lastResponseDate',moment().utc().startOf('day').format('YYYY-MM-DD'));
      window.localStorage.setItem('lastResponseQs', this.state.qs._id);

      if (window.interop) {
        window.interop.sendMessage(`FinishedQuestions:${this.state.qs._id}`);
      } else {
        console.debug('no interop');
      }
      this.setState({submitted: true, submiting: false})
    } catch (err) {
      this.setState({submitted: false, submiting: false})
    }
  }

  handleIDWA = event => {
    event.preventDefault()

    this.submitAnswer('IDWA')
  }
  
  handleFormSubmit = event => {
    event.preventDefault();
    this.submitAnswer(this.state.selectedOption)
  }

  handleOptionChange = changeEvent => {
    this.setState({
      selectedOption: changeEvent.target.value
    });
    this.submitButton.focus();
  }

  render(){
    const {query={}, selectedOption, loading, submiting, error} = this.state;
    const {question="", options=[]} = query;
    if (loading || submiting) {
      return <div style={{display:'flex', justifyContent:'center', padding: "1em", minWidth:'600px', minHeight: '200px'}}>
        <Loader active size='huge'>Looking for today's question...</Loader>
      </div>
    }

    if (error) {
      return <div><h3>{error}</h3></div>
    }

    if (this.state.submitted) {
      return <div className="qcard">
        <h2>All done!</h2>
        <h3>thank you for participating.</h3>
      </div> 
    }

    return <div className="qcard">
      <h2>{question}</h2>
      <form onSubmit={this.handleFormSubmit}>
      <div className="hradio">
        {options.map((op,i)=><label key={"kqo"+i}>
          <input
            type="radio"
            name={"option"+i}
            value={op.option}
            checked={selectedOption === op.option}
            onChange={this.handleOptionChange}
          />
          {op.value}
        </label>)}
        </div>
        <button ref={btn=>this.submitButton=btn} type='submit' disabled={this.state.selectedOption===null}>Submit</button>
        <a href='/' onClick={this.handleIDWA}>i don't want to answer</a>
      </form>
    </div>
  }
}
