'use client';

import { useState, useEffect, useRef } from "react";

interface Product {
  cropId: string;
  title: string;
  price: string;
  image: string;
  buyLink: string;
}

export default function Home() {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [result, setResult] = useState<{ crop: string; matchedProduct: Product } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionItemsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/mock-products.json");
        const data: Product[] = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Failed to load products:", err);
      }
    };
    
    fetchProducts();
  }, []);

  // Handle outside clicks to close suggestion dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Reset suggestionItemsRef when suggestions change
  useEffect(() => {
    suggestionItemsRef.current = suggestionItemsRef.current.slice(0, suggestions.length);
    setSelectedSuggestionIndex(-1);
  }, [suggestions]);

  // Update suggestions when input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    
    if (value.trim()) {
      const filtered = products.filter(product => 
        product.cropId.toLowerCase().includes(value.toLowerCase()) || 
        product.title.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5)); // Limit to 5 suggestions
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    setSelectedSuggestionIndex(-1);
  };
  
  // Handle keyboard navigation for suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) {
      if (e.key === 'Enter') {
        handleSearch();
        return;
      }
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setShowSuggestions(true);
        return;
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : prev
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
          selectSuggestion(suggestions[selectedSuggestionIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
      default:
        break;
    }
  };

  const selectSuggestion = (product: Product) => {
    setInput(product.cropId);
    setShowSuggestions(false);
    // Optionally auto-search when suggestion is selected
    setResult({
      crop: product.cropId,
      matchedProduct: product,
    });
  };

  const handleSearch = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const matched = products.find(
        (product) => product.cropId.toLowerCase().includes(input.trim().toLowerCase())
      );

      if (matched) {
        setResult({
          crop: input.trim(),
          matchedProduct: matched,
        });
      } else {
        setError("No matching product found.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch products.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8 font-sans text-gray-100">
      <div className="w-full max-w-3xl bg-gray-800 rounded-xl shadow-xl p-8 mb-8 border border-gray-700">
        <div className="flex items-center justify-center mb-6">
          <span className="text-4xl mr-3">🌱</span>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">
            Crop Matcher
          </h1>
        </div>

        <div className="relative mb-6">
          <div className="flex items-center gap-2">
            <div className="relative flex-grow">
              <input
                ref={inputRef}
                type="text"
                placeholder="Enter Crop Name or NFT ID"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => input.trim() && suggestions.length > 0 && setShowSuggestions(true)}
                className="w-full border-2 border-gray-700 focus:border-emerald-500 bg-gray-900 rounded-lg px-4 py-3 focus:outline-none transition-colors text-gray-100 placeholder-gray-500"
              />
              {input.trim() && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 text-gray-400">
                  {suggestions.length > 0 && (
                    <span className="text-xs bg-gray-700 rounded px-1 py-0.5">
                      {showSuggestions ? 'ESC to close' : '↓ for options'}
                    </span>
                  )}
                </div>
              )}
              {showSuggestions && suggestions.length > 0 && (
                <div 
                  ref={suggestionRef}
                  className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden"
                >
                  {suggestions.map((product, index) => (
                    <div
                      key={product.cropId}
                      ref={el => {
                        suggestionItemsRef.current[index] = el;
                      }}
                      onClick={() => selectSuggestion(product)}
                      onMouseEnter={() => setSelectedSuggestionIndex(index)}
                      className={`flex items-center px-4 py-3 cursor-pointer border-b border-gray-700 last:border-b-0 ${
                        selectedSuggestionIndex === index ? 'bg-gray-700' : 'hover:bg-gray-700'
                      }`}
                    >
                      <div className="w-10 h-10 mr-3 bg-gray-600 rounded-full overflow-hidden flex-shrink-0">
                        {product.image && (
                          <img 
                            src={product.image} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="font-medium text-gray-100">{product.title}</div>
                        <div className="text-sm text-gray-400">{product.cropId}</div>
                      </div>
                      {selectedSuggestionIndex === index && (
                        <div className="flex-shrink-0 ml-2 flex items-center">
                          <span className="text-xs bg-emerald-600 text-gray-100 rounded px-1.5 py-0.5">
                            Enter
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-gray-100 font-medium px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-100" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching
                </>
              ) : (
                <>Search</>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900 bg-opacity-30 border-l-4 border-red-500 p-4 rounded mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-red-400">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className="w-full max-w-3xl animate-fadeIn">
          <h2 className="text-2xl font-semibold mb-4 text-center">
            <span className="text-gray-400">Result for:</span> {result.crop}
          </h2>
          <div className="bg-gray-800 shadow-xl rounded-xl overflow-hidden border border-gray-700">
            <div className="md:flex">
              <div className="md:w-1/2 p-6">
                <div className="bg-gray-900 rounded-lg p-4 h-full flex items-center justify-center">
                  <img
                    src={result.matchedProduct.image}
                    alt={result.matchedProduct.title}
                    className="max-w-full max-h-64 object-contain rounded"
                  />
                </div>
              </div>
              <div className="md:w-1/2 p-6">
                <h3 className="text-2xl font-bold mb-4 text-gray-100">{result.matchedProduct.title}</h3>
                <div className="mb-4">
                  <span className="text-gray-400">ID:</span> <span className="text-gray-200">{result.matchedProduct.cropId}</span>
                </div>
                <div className="mb-6">
                  <span className="text-gray-400">Price:</span> 
                  <span className="text-2xl font-semibold text-emerald-400 ml-2">
                    {result.matchedProduct.price}
                  </span>
                </div>
                <a
                  href={result.matchedProduct.buyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-emerald-600 hover:bg-emerald-700 text-gray-100 font-medium px-6 py-3 rounded-lg transition-colors w-full text-center"
                >
                  Buy Now
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 right-4 bg-gray-800 bg-opacity-90 shadow-xl rounded-lg p-3 text-sm border border-gray-700">
        <div className="font-semibold mb-1 text-gray-200">Keyboard shortcuts:</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <div className="text-gray-400">Enter</div>
          <div className="text-gray-300">Search or select</div>
          <div className="text-gray-400">↑/↓</div>
          <div className="text-gray-300">Navigate suggestions</div>
          <div className="text-gray-400">Esc</div>
          <div className="text-gray-300">Close suggestions</div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </main>
  );
}