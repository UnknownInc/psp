import React, { Component } from 'react'
import Spinner from '../Spinner'
import { QUESTIONS_API, getHeaders } from '../../config'

import './QuestionCard.css';
import { Loader } from 'semantic-ui-react';

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
    try {
      const headers=getHeaders();
      const response = await fetch(`${QUESTIONS_API}/api/questions/current`, {headers})

      if (response.status===401) {
        this.setState({isNotLoggedIn: true, loading: false});
        return 
      } 

      if (response.status>=500) {
        this.setState({error: "Oops! encountering some technical difficulties, Please visit after sometime.", loading: false});
        return
      }

      const q = await response.json() 
      
      if (q._id) {
        this.setState({loading: false, query: q})
      } else {
        this.setState({loading: false, submitted: true})
      }
    }
    catch(err) {
      console.error(err);
    }
  }

  submitAnswer = (option)=>{
    this.setState({submiting: true});

    setTimeout(()=>{
      this.setState({submitted: true, submiting: false})
    }, 2000);
  }

  handleIDWA = event => {
    event.preventDefault()

    this.submitAnswer()
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
