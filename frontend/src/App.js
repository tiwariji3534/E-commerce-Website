import './App.css';
import Navbar from './Components/Navbar/Navbar';
import { BrowserRouter,Routes,Route } from 'react-router-dom';
import Shop from './Pages/Shop';
import ShopCategory from './Pages/ShopCategory';
import Product from './Pages/Product';
import Cart from './Pages/Cart';
import LoginSignup from './Pages/LoginSignup';
import Footer from './Components/Footer/Footer';
import men_banner from './Components/Assets/banner_mens.png'
import women_banner from './Components/Assets/banner_women.png'
import kid_banner from './Components/Assets/banner_kids.png'



function App() {
  
  return (
    <div>
      <BrowserRouter>
      <Navbar/>

      <Routes>
        <Route path='/' element={<Shop/>}/>
        <Route exact path='/mens' element={<ShopCategory banner={men_banner} category="mens"/>}/>
        <Route exact path='/womens' element={<ShopCategory banner={women_banner} category="womens"/>}/>
        <Route exact path='/kids' element={<ShopCategory banner={kid_banner} category="kids"/>}/>
        <Route exact path='/product' element={<Product/>}>
        <Route exact path=':productId' element={<Product/>}/>
        </Route>
        <Route exact path='/cart' element={<Cart/>}/>
        <Route exact path='/login' element={<LoginSignup/>}/>
      </Routes>
      <Footer/>
      </BrowserRouter>
    </div>
  );
}

export default App;
