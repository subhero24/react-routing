import React, { useEffect } from 'react';

export default function Redirect() {
	throw new Error(
		`The <Redirect /> element should not be used in your components, but must only be used in the router route config`,
	);
}
