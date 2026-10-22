import { NavLink } from 'react-router-dom';

import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Receipt,
    RotateCcw,
    Warehouse,
    Lightbulb,
    LogOut,
    ShieldCheck,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

const links = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Products", path: "/products", icon: Package },
    { name: "Orders", path: "/orders", icon: ShoppingCart },
    { name: "Expenses", path: "/expenses", icon: Receipt },
    { name: "Returns", path: "/returns", icon: RotateCcw },
    { name: "Inventory", path: "/inventory", icon: Warehouse },
    { name: "Insights", path: "/insights", icon: Lightbulb },
];


function Sidebar() {
    const { logout } = useAuth();

    return (
        <aside className='sidebar'>
            <div className='brand'>
                <ShieldCheck size={32} />
                <span>SellerShield</span>
            </div>

            <nav className="sidebar-nav">
                {links.map(({ name, path, icon: Icon }) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) =>
                            isActive ? "nav-link active" : "nav-link"
                        }
                    >
                        <Icon size={19} />
                        <span>{name}</span>
                    </NavLink>
                ))}
            </nav>

            <button className='logout-button' onClick={logout}>
                <LogOut size={19} />
                <span>Logout</span>
            </button>
        </aside>
    )
}

export default Sidebar;