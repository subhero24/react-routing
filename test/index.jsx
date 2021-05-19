import React from 'react';
import ReactDom from 'react-dom';
import Application from './application.jsx';

import { Suspense } from 'react';

function Root() {
	return (
		<Suspense fallback={null}>
			<Application />
		</Suspense>
	);
}

ReactDom.unstable_createRoot(document.getElementById('root')).render(<Root />);
