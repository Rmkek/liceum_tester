import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import registerServiceWorker from './registerServiceWorker'

import PageContainer from './Reusables/PageContainer/PageContainer'
import AdminPage from './Pages/Admin/AdminPage'
import TeacherPage from './Pages/Teacher/TeacherPage'

import App from './Pages/App/App'
import Assignments from './Pages/Assignments/Assignments'
import RegisterTeacher from './Pages/Teacher/RegisterTeacher'
import AddInfo from './Pages/AddInfo/AddInfo'
import Assignment from './Pages/Assignments/Assignment/Assignment'

import Admin from './Pages/Admin/Admin'
import AddAssignments from './Pages/Admin/AddAssignments/AddAssignments'

import Teacher from './Pages/Teacher/Teacher'

import 'bootstrap/dist/css/bootstrap.css'
import './index.css'

ReactDOM.render(
  <Router>
    <div>
      <Route exact path='/' render={() => <PageContainer component={<App />} />} />
      <Route exact path='/add-info' render={routeProps => <PageContainer component={<AddInfo {...routeProps} />} />} />
      <Route exact path='/assignments' render={routeProps => <PageContainer component={<Assignments {...routeProps} />} />} />
      <Route path='/assignment' render={routeProps => <PageContainer component={<Assignment {...routeProps} />} />} />
      <Route exact path='/register-teacher' render={routeProps => <PageContainer component={<RegisterTeacher {...routeProps} />} />} />

      <Route exact path='/teacher' render={routeProps => <TeacherPage component={<Teacher />} />} />
      <Route exact path='/teacher/add-assignments' render={() => <TeacherPage component={<AddAssignments />} />} />

      <Route exact path='/admin' render={() => <AdminPage component={<Admin />} />} />

    </div>
  </Router>,
  document.getElementById('root')
)

registerServiceWorker()
