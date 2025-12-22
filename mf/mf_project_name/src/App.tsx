import { useNavigate } from 'react-router';
import './App.css';
import Provider from './components/ProviderComponent';


const App = () => {
  useNavigate()
  return (
    <div className="content">
      <Provider />
    </div>
  );
};

export default App;
