import { createContext } from 'react';

// We do not use the browsers location as the default for this context,
// as the context is also used in other environments
export default createContext({});
