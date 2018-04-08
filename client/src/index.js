import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import registerServiceWorker from './registerServiceWorker'

import PageContainer from './Reusables/PageContainer/PageContainer'
import AdminPage from './Pages/Admin/AdminPage'
import TeacherPage from './Pages/Teacher/TeacherPage'

import Landing from './Pages/Landing/Landing'
import Login from './Pages/Login/Login'
import Assignments from './Pages/User/Assignments/Assignments'
import RegisterUser from './Pages/User/RegisterUser'
import Assignment from './Pages/User/Assignments/Assignment/Assignment'

import Admin from './Pages/Admin/Admin'

import Teacher from './Pages/Teacher/Teacher'
import AddAssignments from './Pages/Teacher/AddAssignments/AddAssignments'
import ApproveStudents from './Pages/Teacher/ApproveStudents/ApproveStudents'
import RegisterTeacher from './Pages/Teacher/RegisterTeacher/RegisterTeacher'
import MyStudents from './Pages/Teacher/MyStudents/MyStudents'

import 'bootstrap/dist/css/bootstrap.css'
import './index.css'

ReactDOM.render(
  <Router>
    <div>
      {/* Registration and login routes */}
      <Route exact path='/' render={() => <PageContainer component={<Landing />} />} />
      <Route exact path='/register-user' render={() => <PageContainer component={<RegisterUser />} />} />
      <Route exact path='/register-teacher' render={routeProps => <PageContainer component={<RegisterTeacher {...routeProps} />} />} />
      <Route exact path='/login' render={routeProps => <PageContainer component={<Login {...routeProps} />} />} />

      {/* User routes */}
      <Route exact path='/assignments' render={routeProps => <PageContainer component={<Assignments {...routeProps} />} />} />
      <Route path='/assignment' render={routeProps => <PageContainer component={<Assignment {...routeProps} />} />} />

      <Route exact path='/teacher' render={routeProps => <TeacherPage component={<Teacher />} />} />
      <Route exact path='/teacher/add-assignments' render={() => <TeacherPage component={<AddAssignments />} />} />
      <Route exact path='/teacher/approve-students' render={() => <TeacherPage component={<ApproveStudents />} />} />
      <Route exact path='/teacher/my-students' render={() => <TeacherPage component={<MyStudents />} />} />

      <Route exact path='/admin' render={() => <AdminPage component={<Admin />} />} />
    </div>
  </Router>,
  document.getElementById('root')
)

registerServiceWorker()
