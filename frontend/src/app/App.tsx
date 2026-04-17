import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { GuestRoute } from '../components/GuestRoute';
import { PrivateRoute } from '../components/PrivateRoute';
import { useAuth } from '../features/auth/AuthContext';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminLayout } from '../pages/admin/AdminLayout';
import { AdminPosts } from '../pages/admin/AdminPosts';
import { AdminUsers } from '../pages/admin/AdminUsers';
import { CreatePostPage } from '../features/create/CreatePostPage';
import { DirectPage } from '../features/direct/DirectPage';
import { ExplorePage } from '../features/explore/ExplorePage';
import { FeedPage } from '../features/feed/FeedPage';
import { BookmarksPage } from '../features/misc/BookmarksPage';
import { NotFoundPage } from '../features/misc/NotFoundPage';
import { SavedPage } from '../features/misc/SavedPage';
import { NotificationsPage } from '../features/notifications/NotificationsPage';
import { EditPostPage } from '../features/post/EditPostPage';
import { PostDetailPage } from '../features/post/PostDetailPage';
import { FollowListPage } from '../features/profile/FollowListPage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { ReelsPage } from '../features/reels/ReelsPage';
import { SearchPage } from '../features/search/SearchPage';
import { AccountEditPage } from '../features/settings/AccountEditPage';
import {
  AboutSettingsPage,
  HelpSettingsPage,
  PasswordSettingsPage,
} from '../features/settings/SettingsSubPages';
import { SettingsPage } from '../features/settings/SettingsPage';

function HomeEntry() {
  const { user, isAuthenticated } = useAuth();
  if (isAuthenticated && user?.isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  return <FeedPage />;
}

export function App() {
  return (
    <Routes>
      <Route
        path="/admin"
        element={
          <PrivateRoute>
            <AdminLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="posts" element={<AdminPosts />} />
      </Route>

      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />

      <Route path="/*" element={<AppShell />}>
        <Route index element={<HomeEntry />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route
          path="create"
          element={
            <PrivateRoute>
              <CreatePostPage />
            </PrivateRoute>
          }
        />
        <Route path="reels" element={<ReelsPage />} />
        <Route
          path="direct"
          element={
            <PrivateRoute>
              <DirectPage />
            </PrivateRoute>
          }
        />
        <Route
          path="direct/:conversationId"
          element={
            <PrivateRoute>
              <DirectPage />
            </PrivateRoute>
          }
        />
        <Route
          path="notifications"
          element={
            <PrivateRoute>
              <NotificationsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="saved"
          element={
            <PrivateRoute>
              <SavedPage />
            </PrivateRoute>
          }
        />
        <Route
          path="bookmarks"
          element={
            <PrivateRoute>
              <BookmarksPage />
            </PrivateRoute>
          }
        />
        <Route
          path="accounts/edit"
          element={
            <PrivateRoute>
              <AccountEditPage />
            </PrivateRoute>
          }
        />
        <Route
          path="settings/password"
          element={
            <PrivateRoute>
              <PasswordSettingsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="settings/help"
          element={
            <PrivateRoute>
              <HelpSettingsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="settings/about"
          element={
            <PrivateRoute>
              <AboutSettingsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="settings"
          element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="p/:postId/edit"
          element={
            <PrivateRoute>
              <EditPostPage />
            </PrivateRoute>
          }
        />
        <Route path="p/:postId" element={<PostDetailPage />} />
        <Route path=":username/followers" element={<FollowListPage variant="followers" />} />
        <Route path=":username/following" element={<FollowListPage variant="following" />} />
        <Route path=":username" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
