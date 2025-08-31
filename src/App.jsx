// src/App.jsx
import { useEffect, useState } from 'react';
import './App.css';
import { useVoice } from './hooks/useVoice';
import { useShoppingStore } from './store/useShoppingStore';
import { productRecommendations, seasonalRecommendations, substitutes } from './data/suggestions';
import { availableProducts } from './data/products';

// Mapping for number words to digits (English and Hindi)
const numberWords = {
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'ek': 1, 'do': 2, 'teen': 3, 'chaar': 4, 'paanch': 5,
  'chhe': 6, 'saat': 7, 'aath': 8, 'nau': 9, 'das': 10
};

function App() {
  const [selectedLanguage, setSelectedLanguage] = useState('en-US'); 
  const { transcript, isListening, startListening, stopListening, error } = useVoice(selectedLanguage);
  const { list, addToList, removeFromList } = useShoppingStore();
  const [suggestion, setSuggestion] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [statusMessage, setStatusMessage] = useState(''); 

  const categorizedList = list.reduce((acc, item) => {
    const { category } = item;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  const getSeasonalRecommendation = () => {
    const month = new Date().getMonth();
    const season = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'];
    const currentSeason = season[month];
    const recommendation = seasonalRecommendations.find(item => item.season === currentSeason);
    return recommendation ? `Don't forget to grab some ${recommendation.item}!` : '';
  };

  useEffect(() => {
    if (transcript) {
      console.log('Raw Transcript:', transcript);
      const lowerTranscript = transcript.toLowerCase();

      // Keywords for commands (English and Hindi)
      const addKeywords = ['add', 'i need', 'buy', 'get me', 'put', 'jodein', 'khareeden', 'len', 'jodo'];
      const removeKeywords = ['remove', 'take out', 'delete', 'get rid of', 'hatao', 'nikalo', 'hatana'];
      const searchKeywords = ['find', 'search for', 'look for', 'khojo', 'dhundo'];

      const processCommand = (text) => {
        let command = null;
        let item = null;
        
        for (const keyword of addKeywords) {
          if (text.includes(keyword)) {
            item = text.split(keyword)[1]?.trim();
            if (item) {
              command = 'add';
              break;
            }
          }
        }

        if (!command) {
          for (const keyword of removeKeywords) {
            if (text.includes(keyword)) {
              item = text.split(keyword)[1]?.trim();
              if (item) {
                command = 'remove';
                break;
              }
            }
          }
        }

        if (!command) {
          for (const keyword of searchKeywords) {
            if (text.includes(keyword)) {
              item = text.split(keyword)[1]?.trim();
              if (item) {
                command = 'search';
                break;
              }
            }
          }
        }
        return { command, item };
      };

      const { command, item } = processCommand(lowerTranscript);

      if (command === 'add' && item) {
        setSearchResults([]);
        const quantityMatch = item.match(/^(\d+|one|two|three|four|five|six|seven|eight|nine|ten|ek|do|teen|chaar|paanch|chhe|saat|aath|nau|das)\s+(.*)/);
        let quantity = 1;
        let itemName = item;
        
        if (quantityMatch) {
          const numberPart = quantityMatch[1];
          quantity = numberWords[numberPart] || parseInt(numberPart, 10);
          itemName = quantityMatch[2].trim();
        }
        
        addToList(itemName, quantity);
        console.log(`Added ${quantity} of ${itemName}`);
        setStatusMessage(`Added ${quantity} of ${itemName}`);
        
        const substitute = substitutes[itemName];
        if (substitute) {
          setSuggestion(`We also have ${substitute} in stock. Would you like to add that instead?`);
        } else if (productRecommendations[itemName] && productRecommendations[itemName].length > 0) {
          const recommendedItem = productRecommendations[itemName][0];
          setSuggestion(`It looks like you're running low on ${recommendedItem}.`);
        } else {
          setSuggestion('');
        }

      } else if (command === 'remove' && item) {
        setSearchResults([]);
        const quantityMatch = item.match(/^(\d+|one|two|three|four|five|six|seven|eight|nine|ten|ek|do|teen|chaar|paanch|chhe|saat|aath|nau|das)\s+(.*)/);
        let quantityToRemove = 1;
        let itemName = item;
        
        if (quantityMatch) {
          const numberPart = quantityMatch[1];
          quantityToRemove = numberWords[numberPart] || parseInt(numberPart, 10);
          itemName = quantityMatch[2].trim();
        }

        removeFromList(itemName, quantityToRemove);
        console.log(`Removed: ${quantityToRemove} of ${itemName}`);
        setStatusMessage(`Removed ${quantityToRemove} of ${itemName}`);
        setSuggestion('');

      } else if (command === 'search' && item) {
        setSearchResults([]);
        let filteredProducts = availableProducts;
        let searchInfo = item;
        
        const priceMatch = searchInfo.match(/under\s+\$?(\d+)/);
        if (priceMatch) {
          const maxPrice = parseFloat(priceMatch[1]);
          filteredProducts = filteredProducts.filter(p => p.price <= maxPrice);
          searchInfo = searchInfo.replace(priceMatch[0], '').trim();
        }

        const terms = searchInfo.split(' ').map(t => t.toLowerCase());
        filteredProducts = filteredProducts.filter(product => {
          const productName = product.name.toLowerCase();
          const hindiName = product.hindi_name ? product.hindi_name.toLowerCase() : '';
          const productBrand = product.brand.toLowerCase();
          const productAttributes = product.attributes.map(attr => attr.toLowerCase());
          
          const isMatch = terms.some(term => 
            productName.includes(term) ||
            hindiName.includes(term) ||
            productBrand.includes(term) || 
            productAttributes.includes(term)
          );
          return isMatch;
        });

        if (filteredProducts.length > 0) {
          setSearchResults(filteredProducts);
          setSuggestion(`Found ${filteredProducts.length} items for "${searchInfo}".`);
        } else {
          setSearchResults([]);
          setSuggestion(`No items found for "${searchInfo}".`);
        }
      }
    }
    
    const timer = setTimeout(() => {
      setStatusMessage('');
    }, 3000);

    return () => clearTimeout(timer);
  }, [transcript, addToList, removeFromList]);

  return (
    <div className="App">
      <header>
        <h1>🛒 Voice Shopping Assistant</h1>
      </header>
      <main>
        <div className="language-selector">
          <label htmlFor="lang-select">Choose Language:</label>
          <select id="lang-select" value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}>
            <option value="en-US">English</option>
            <option value="hi-IN">Hindi</option>
            <option value="es-ES">Spanish</option>
            <option value="fr-FR">French</option>
            <option value="de-DE">German</option>
          </select>
        </div>
        <div className="voice-controls">
          <p>Status: {isListening ? 'Listening...' : 'Idle'}</p>
          <p>{error && `Error: ${error}`}</p>
          <button onClick={isListening ? stopListening : startListening}>
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </button>
          {statusMessage && <p className="status-message">{statusMessage}</p>}
        </div>
        <div className="suggestion-box">
          <p>{suggestion || getSeasonalRecommendation()}</p>
        </div>
        
        {searchResults.length > 0 && (
          <div className="search-results-container">
            <h2>Search Results</h2>
            <ul>
              {searchResults.map((product, index) => (
                <li key={index}>
                  {product.name} - ${product.price.toFixed(2)} ({product.brand})
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="shopping-list-container">
          <h2>My Shopping List</h2>
          {Object.keys(categorizedList).length === 0 ? (
            <p>Your list is empty. Try saying "Add milk" .</p>
          ) : (
            Object.keys(categorizedList).map(category => (
              <div key={category} className="category-group">
                <h3>{category}</h3>
                <ul>
                  {categorizedList[category].map(item => (
                    <li key={item.id}>{item.name} ({item.quantity})</li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default App;