
import { Route, Routes, Navigate} from 'react-router-dom';
import Home from '../pages/Home';

const Router = () => {
    return (
        <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/posts' element={<h1>Posts Page</h1>} />
            <Route path='/posts/:id' element={<h1>Posts Detail Page</h1>} />
            <Route path='/posts/new' element={<h1>Posts New Page</h1>} />
            <Route path='/posts/edit/:id' element={<h1>Posts Edit Page</h1>} />
            <Route path='/profile' element={<h1>Profile Page</h1>} />
            <Route path='/*' element={<Navigate replace to='/'/>} />
        </Routes>
    )
}

export default Router;