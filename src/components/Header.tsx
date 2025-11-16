import { ShoppingCart, Search, Menu, User, LogOut, UserCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface HeaderProps {
  cartItemCount: number;
  onCartClick: () => void;
  onSearch: (query: string) => void;
  onNavigate?: (section: string) => void;
  isLoggedIn?: boolean;
  userEmail?: string;
  isAdmin?: boolean;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
}

export function Header({ cartItemCount, onCartClick, onSearch, onNavigate, isLoggedIn, userEmail, isAdmin, onLoginClick, onLogoutClick }: HeaderProps) {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, section: string) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(section);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <button className="lg:hidden">
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-2xl">TechStore</h1>
          </div>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            <a 
              href="#home" 
              className="hover:opacity-70 transition-opacity cursor-pointer"
              onClick={(e) => handleNavClick(e, 'home')}
            >
              Trang chủ
            </a>
            <a 
              href="#products" 
              className="hover:opacity-70 transition-opacity cursor-pointer"
              onClick={(e) => handleNavClick(e, 'products')}
            >
              Sản phẩm
            </a>
            <a 
              href="#deals" 
              className="hover:opacity-70 transition-opacity cursor-pointer"
              onClick={(e) => handleNavClick(e, 'deals')}
            >
              Khuyến mãi
            </a>
            <a 
              href="#about" 
              className="hover:opacity-70 transition-opacity cursor-pointer"
              onClick={(e) => handleNavClick(e, 'about')}
            >
              Giới thiệu
            </a>
            <a 
              href="#contact" 
              className="hover:opacity-70 transition-opacity cursor-pointer"
              onClick={(e) => handleNavClick(e, 'contact')}
            >
              Liên hệ
            </a>
          </nav>

          {/* Search */}
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Tìm kiếm sản phẩm..."
                className="pl-10"
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Actions - Cart & User */}
          <div className="flex items-center gap-3">
            {/* User Menu */}
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="gap-2 h-10 px-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                      <UserCircle className="h-5 w-5 text-white" />
                    </div>
                    <div className="hidden lg:flex flex-col items-start">
                      <span className="text-xs text-gray-500">Xin chào</span>
                      <span className="text-sm max-w-[100px] truncate">
                        {userEmail?.split('@')[0] || 'User'}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm">{userEmail}</p>
                      {isAdmin && (
                        <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white w-fit">
                          Admin
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogoutClick} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                className="gap-2"
                onClick={onLoginClick}
              >
                <User className="h-5 w-5" />
                <span className="hidden lg:inline">Đăng nhập</span>
              </Button>
            )}

            {/* Divider */}
            <div className="h-8 w-px bg-gray-200"></div>

            {/* Cart */}
            <Button
              variant="ghost"
              className="relative gap-2 hover:bg-blue-50"
              onClick={onCartClick}
            >
              <div className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-gradient-to-r from-blue-600 to-purple-600">
                    {cartItemCount}
                  </Badge>
                )}
              </div>
              <div className="hidden lg:flex flex-col items-start">
                <span className="text-xs text-gray-500">Giỏ hàng</span>
                <span className="text-sm">
                  {cartItemCount > 0 ? `${cartItemCount} sản phẩm` : 'Trống'}
                </span>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}