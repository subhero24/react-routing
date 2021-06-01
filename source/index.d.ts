import { ReactElement } from "react";

export default function Routes(config: any, options?: { base?: string, location?: string | URL, history?: History, document?: Document }): ReactElement;

export function useData(resource?: { status: string, result: any }): any;
export function useSplat(): string[];
export function useParams(): object;
export function usePending(): boolean
export function useHistory(): History & { navigate: (path: string | null | undefined, options?: { sticky?: boolean, replace?: boolean, state?: any, title?: string }) => void };
export function useNavigate(): (path: string | null | undefined, options?: { sticky?: boolean, replace?: boolean, state?: any, title?: string }) => void;
export function useLocation(): Location;
export function useResource(): { status: string, result: any };

export function Link(props: { to?: string, href?: string, state?: any, title?: string, replace?: boolean, sticky?: boolean, onClick?: MouseEvent, [key: string]: any }): ReactElement;
export function Redirect(props: {}): void;