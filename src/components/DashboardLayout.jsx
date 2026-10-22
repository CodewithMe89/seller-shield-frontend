import {Outlet, useNavigate} from 'react-router-dom';
import {Bell} from 'lucide-react';
import Sidebar from './Sidebar';

function DashboardLayout() {
    const navigate = useNavigate();

    return (
        <div className='app-layout'>
            <Sidebar/>
            <div className="main-content">
                <header className="topbar">
                    <div>
                        <h2>Seller Dashboard</h2>
                        <p>Monitor your business performance</p>
                    </div>

                    <button 
                    className='icon-button' 
                    aria-label='Go to insights' 
                    onClick={() => navigate("/insights")}> 
                        <Bell size={20} />
                    </button>
                </header>

                <section className='page-content'>
                    <Outlet />
                </section>
            </div>
        </div>
    )
}

export default DashboardLayout;