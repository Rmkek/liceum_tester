import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import Assignments from './Assignments'
import Admin from './Admin'
import {BrowserRouter as Router,
        Route} from 'react-router-dom';
import registerServiceWorker from './registerServiceWorker';

//Link
ReactDOM.render(
  <Router>
    <div>
      <Route exact path='/' component={App} />
      <Route exact path='/assignments' component={Assignments}/>
      <Route exact path='/admin' component={Admin} />
    </div>
  </Router>,
  document.getElementById('root')
)

registerServiceWorker();