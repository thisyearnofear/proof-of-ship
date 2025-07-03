import React, { useState } from 'react';
import { 
  Button, 
  ButtonGroup, 
  IconButton,
  Input, 
  Textarea, 
  Select, 
  Checkbox, 
  Radio,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  StatCard,
  FeatureCard,
  Modal,
  ConfirmModal,
  AlertModal,
  Drawer,
  ThemeToggle,
  useToastActions,
  // Illustration System
  Icon,
  CustomIcons,
  NetworkIcon,
  StatusIcon,
  LoadingSpinner,
  PulsingDots,
  SkeletonLoader,
  CardSkeleton,
  LoadingState,
  EmptyState,
  NoProjectsEmptyState,
  ErrorState,
  NetworkErrorState,
  GitHubErrorState
} from '@/components/common';
import { 
  HeartIcon, 
  StarIcon, 
  PlusIcon, 
  TrashIcon,
  CogIcon,
  BellIcon,
  UserIcon,
  ChartBarIcon,
  CreditCardIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

export default function ComponentsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    category: '',
    newsletter: false,
    plan: 'basic'
  });

  const toast = useToastActions();

  const handleFormSubmit = (e) => {
    e.preventDefault();
    toast.success('Form submitted successfully!', {
      title: 'Success',
      duration: 3000
    });
  };

  const handleToastDemo = (type) => {
    switch (type) {
      case 'success':
        toast.success('This is a success message!');
        break;
      case 'error':
        toast.error('This is an error message!');
        break;
      case 'warning':
        toast.warning('This is a warning message!');
        break;
      case 'info':
        toast.info('This is an info message!');
        break;
      case 'promise':
        toast.promise(
          new Promise((resolve) => setTimeout(resolve, 2000)),
          {
            loading: 'Loading data...',
            success: 'Data loaded successfully!',
            error: 'Failed to load data'
          }
        );
        break;
    }
  };

  return (
    <div className="space-y-12 py-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">Component Library</h1>
        <p className="text-lg text-secondary max-w-2xl mx-auto">
          A comprehensive showcase of all standardized components built with our design token system.
        </p>
        <div className="mt-6">
          <ThemeToggle variant="tabs" />
        </div>
      </div>

      {/* Buttons Section */}
      <section>
        <h2 className="text-2xl font-semibold text-primary mb-6">Buttons</h2>
        <div className="space-y-6">
          {/* Button Variants */}
          <div>
            <h3 className="text-lg font-medium text-primary mb-4">Variants</h3>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="success">Success</Button>
              <Button variant="warning">Warning</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>

          {/* Button Sizes */}
          <div>
            <h3 className="text-lg font-medium text-primary mb-4">Sizes</h3>
            <div className="flex flex-wrap items-center gap-4">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button size="xl">Extra Large</Button>
            </div>
          </div>

          {/* Button States */}
          <div>
            <h3 className="text-lg font-medium text-primary mb-4">States</h3>
            <div className="flex flex-wrap gap-4">
              <Button>Normal</Button>
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
              <Button leftIcon={<PlusIcon className="h-4 w-4" />}>With Left Icon</Button>
              <Button rightIcon={<StarIcon className="h-4 w-4" />}>With Right Icon</Button>
            </div>
          </div>

          {/* Button Group */}
          <div>
            <h3 className="text-lg font-medium text-primary mb-4">Button Group</h3>
            <ButtonGroup>
              <Button variant="outline">First</Button>
              <Button variant="outline">Second</Button>
              <Button variant="outline">Third</Button>
            </ButtonGroup>
          </div>

          {/* Icon Buttons */}
          <div>
            <h3 className="text-lg font-medium text-primary mb-4">Icon Buttons</h3>
            <div className="flex flex-wrap gap-4">
              <IconButton icon={<HeartIcon />} aria-label="Like" />
              <IconButton icon={<StarIcon />} aria-label="Favorite" variant="primary" />
              <IconButton icon={<TrashIcon />} aria-label="Delete" variant="danger" />
              <IconButton icon={<CogIcon />} aria-label="Settings" size="lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Form Components Section */}
      <section>
        <h2 className="text-2xl font-semibold text-primary mb-6">Form Components</h2>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Contact Form</CardTitle>
            <CardDescription>Showcase of all form components</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              
              <Input
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                leftIcon={<UserIcon />}
              />
              
              <Select
                label="Category"
                placeholder="Select a category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="general">General Inquiry</option>
                <option value="support">Support</option>
                <option value="feedback">Feedback</option>
              </Select>
              
              <Textarea
                label="Message"
                placeholder="Enter your message"
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
              
              <Checkbox
                label="Subscribe to newsletter"
                checked={formData.newsletter}
                onChange={(e) => setFormData({ ...formData, newsletter: e.target.checked })}
              />
              
              <div>
                <p className="text-sm font-medium text-primary mb-3">Plan Selection</p>
                <div className="space-y-2">
                  <Radio
                    label="Basic Plan"
                    name="plan"
                    value="basic"
                    checked={formData.plan === 'basic'}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  />
                  <Radio
                    label="Premium Plan"
                    name="plan"
                    value="premium"
                    checked={formData.plan === 'premium'}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  />
                </div>
              </div>
              
              <Button type="submit" fullWidth>
                Submit Form
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* Cards Section */}
      <section>
        <h2 className="text-2xl font-semibold text-primary mb-6">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Basic Card */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Card</CardTitle>
              <CardDescription>A simple card with header and content</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-secondary">This is the card content area where you can put any information.</p>
            </CardContent>
            <CardFooter>
              <Button size="sm">Action</Button>
            </CardFooter>
          </Card>

          {/* Stat Cards */}
          <StatCard
            title="Total Users"
            value="12,345"
            change="+12%"
            changeType="positive"
            icon={<UserIcon className="h-6 w-6" />}
            description="Active users this month"
          />

          <StatCard
            title="Revenue"
            value="$45,678"
            change="-3%"
            changeType="negative"
            icon={<BanknotesIcon className="h-6 w-6" />}
            trend="Compared to last month"
          />

          {/* Feature Card */}
          <FeatureCard
            icon={<ChartBarIcon className="h-8 w-8" />}
            title="Analytics Dashboard"
            description="Get detailed insights into your project performance with our comprehensive analytics."
            action={<Button size="sm">Learn More</Button>}
          />

          {/* Interactive Card */}
          <Card interactive onClick={() => toast.info('Card clicked!')}>
            <CardContent>
              <div className="text-center py-8">
                <BellIcon className="h-12 w-12 text-primary-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-primary mb-2">Interactive Card</h3>
                <p className="text-secondary">Click me to see the interaction!</p>
              </div>
            </CardContent>
          </Card>

          {/* Loading Card */}
          <StatCard loading />
        </div>
      </section>

      {/* Modals Section */}
      <section>
        <h2 className="text-2xl font-semibold text-primary mb-6">Modals & Overlays</h2>
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Button onClick={() => setConfirmModalOpen(true)} variant="warning">
            Open Confirm Modal
          </Button>
          <Button onClick={() => setAlertModalOpen(true)} variant="success">
            Open Alert Modal
          </Button>
          <Button onClick={() => setDrawerOpen(true)} variant="outline">
            Open Drawer
          </Button>
        </div>

        {/* Modal Components */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Example Modal"
          description="This is a demonstration of the modal component"
          footer={
            <>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setModalOpen(false)}>
                Save Changes
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-secondary">
              This is the modal content area. You can put any content here including forms, 
              images, or other components.
            </p>
            <Input label="Example Input" placeholder="Type something..." />
          </div>
        </Modal>

        <ConfirmModal
          isOpen={confirmModalOpen}
          onClose={() => setConfirmModalOpen(false)}
          onConfirm={() => {
            toast.success('Action confirmed!');
            setConfirmModalOpen(false);
          }}
          title="Confirm Action"
          message="Are you sure you want to proceed with this action? This cannot be undone."
          confirmText="Yes, Proceed"
          cancelText="Cancel"
          variant="danger"
        />

        <AlertModal
          isOpen={alertModalOpen}
          onClose={() => setAlertModalOpen(false)}
          title="Success!"
          message="Your action has been completed successfully."
          type="success"
        />

        <Drawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Settings Panel"
          position="right"
          footer={
            <div className="flex justify-end space-x-3">
              <Button variant="ghost" onClick={() => setDrawerOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setDrawerOpen(false)}>
                Save Settings
              </Button>
            </div>
          }
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-primary mb-4">Preferences</h3>
              <div className="space-y-4">
                <Checkbox label="Enable notifications" />
                <Checkbox label="Auto-save changes" />
                <Checkbox label="Dark mode" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-primary mb-4">Account Settings</h3>
              <div className="space-y-4">
                <Input label="Display Name" placeholder="Your name" />
                <Select label="Language">
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </Select>
              </div>
            </div>
          </div>
        </Drawer>
      </section>

      {/* Icon System Section */}
      <section>
        <h2 className="text-2xl font-semibold text-primary mb-6">Icon System</h2>
        <div className="space-y-6">
          {/* Icon Sizes */}
          <div>
            <h3 className="text-lg font-medium text-primary mb-4">Icon Sizes</h3>
            <div className="flex items-center gap-4">
              <Icon name="StarIcon" size="xs" />
              <Icon name="StarIcon" size="sm" />
              <Icon name="StarIcon" size="md" />
              <Icon name="StarIcon" size="lg" />
              <Icon name="StarIcon" size="xl" />
              <Icon name="StarIcon" size="2xl" />
              <Icon name="StarIcon" size="3xl" />
            </div>
          </div>

          {/* Icon Colors */}
          <div>
            <h3 className="text-lg font-medium text-primary mb-4">Icon Colors</h3>
            <div className="flex items-center gap-4">
              <Icon name="HeartIcon" color="primary" size="lg" />
              <Icon name="HeartIcon" color="success" size="lg" />
              <Icon name="HeartIcon" color="warning" size="lg" />
              <Icon name="HeartIcon" color="error" size="lg" />
              <Icon name="HeartIcon" color="secondary" size="lg" />
            </div>
          </div>

          {/* Custom Icons */}
          <div>
            <h3 className="text-lg font-medium text-primary mb-4">Custom POS Dashboard Icons</h3>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-6">
              <div className="text-center">
                <CustomIcons.CreditScore className="h-8 w-8 text-primary-500 mx-auto mb-2" />
                <p className="text-xs text-secondary">Credit Score</p>
              </div>
              <div className="text-center">
                <CustomIcons.Funding className="h-8 w-8 text-success-500 mx-auto mb-2" />
                <p className="text-xs text-secondary">Funding</p>
              </div>
              <div className="text-center">
                <CustomIcons.MetaMask className="h-8 w-8 text-warning-500 mx-auto mb-2" />
                <p className="text-xs text-secondary">MetaMask</p>
              </div>
              <div className="text-center">
                <CustomIcons.GitHub className="h-8 w-8 text-text-primary mx-auto mb-2" />
                <p className="text-xs text-secondary">GitHub</p>
              </div>
              <div className="text-center">
                <CustomIcons.ProofOfShip className="h-8 w-8 text-primary-500 mx-auto mb-2" />
                <p className="text-xs text-secondary">Proof of Ship</p>
              </div>
              <div className="text-center">
                <CustomIcons.DeveloperBadge className="h-8 w-8 text-success-500 mx-auto mb-2" />
                <p className="text-xs text-secondary">Developer Badge</p>
              </div>
            </div>
          </div>

          {/* Status Icons */}
          <div>
            <h3 className="text-lg font-medium text-primary mb-4">Status Icons</h3>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <StatusIcon status="success" />
                <span className="text-sm">Success</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusIcon status="error" />
                <span className="text-sm">Error</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusIcon status="warning" />
                <span className="text-sm">Warning</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusIcon status="loading" />
                <span className="text-sm">Loading</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Loading States Section */}
      <section>
        <h2 className="text-2xl font-semibold text-primary mb-6">Loading States</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Loading Spinners */}
          <Card>
            <CardHeader>
              <CardTitle>Loading Spinners</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center space-x-4 py-8">
                <LoadingSpinner size="sm" />
                <LoadingSpinner size="md" />
                <LoadingSpinner size="lg" />
              </div>
            </CardContent>
          </Card>

          {/* Pulsing Dots */}
          <Card>
            <CardHeader>
              <CardTitle>Pulsing Dots</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <PulsingDots />
              </div>
            </CardContent>
          </Card>

          {/* Skeleton Loader */}
          <Card>
            <CardHeader>
              <CardTitle>Skeleton Loader</CardTitle>
            </CardHeader>
            <CardContent>
              <SkeletonLoader lines={3} />
            </CardContent>
          </Card>

          {/* Card Skeleton */}
          <div className="md:col-span-2 lg:col-span-3">
            <h3 className="text-lg font-medium text-primary mb-4">Card Skeleton</h3>
            <CardSkeleton />
          </div>

          {/* Loading Illustrations */}
          <div className="md:col-span-2 lg:col-span-3">
            <h3 className="text-lg font-medium text-primary mb-4">Loading Illustrations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LoadingState type="github" size="sm" />
              <LoadingState type="credit" size="sm" />
            </div>
          </div>
        </div>
      </section>

      {/* Empty States Section */}
      <section>
        <h2 className="text-2xl font-semibold text-primary mb-6">Empty States</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NoProjectsEmptyState 
            size="sm"
            onCreateProject={() => toast.info('Create project clicked!')}
          />
          <EmptyState
            size="sm"
            icon={<BellIcon className="h-16 w-16 text-text-tertiary mx-auto" />}
            title="No Notifications"
            description="You're all caught up! We'll notify you when there are updates."
          />
        </div>
      </section>

      {/* Error States Section */}
      <section>
        <h2 className="text-2xl font-semibold text-primary mb-6">Error States</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NetworkErrorState 
            size="sm"
            onRetry={() => toast.info('Retry clicked!')}
          />
          <GitHubErrorState 
            size="sm"
            onRetry={() => toast.info('Retry clicked!')}
            onReconnect={() => toast.info('Reconnect clicked!')}
          />
        </div>
      </section>

      {/* Toast Section */}
      <section>
        <h2 className="text-2xl font-semibold text-primary mb-6">Toast Notifications</h2>
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => handleToastDemo('success')} variant="success">
            Success Toast
          </Button>
          <Button onClick={() => handleToastDemo('error')} variant="danger">
            Error Toast
          </Button>
          <Button onClick={() => handleToastDemo('warning')} variant="warning">
            Warning Toast
          </Button>
          <Button onClick={() => handleToastDemo('info')}>
            Info Toast
          </Button>
          <Button onClick={() => handleToastDemo('promise')} variant="outline">
            Promise Toast
          </Button>
        </div>
      </section>

      {/* Theme Section */}
      <section>
        <h2 className="text-2xl font-semibold text-primary mb-6">Theme System</h2>
        <Card>
          <CardHeader>
            <CardTitle>Theme Controls</CardTitle>
            <CardDescription>Switch between different themes to see the design system in action</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-primary mb-2">Theme Toggle Variants</p>
                <div className="flex flex-wrap gap-4">
                  <ThemeToggle variant="button" />
                  <ThemeToggle variant="dropdown" />
                  <ThemeToggle variant="tabs" />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="p-4 rounded-lg bg-primary-500 text-white text-center">
                  <p className="font-medium">Primary</p>
                </div>
                <div className="p-4 rounded-lg bg-success-500 text-white text-center">
                  <p className="font-medium">Success</p>
                </div>
                <div className="p-4 rounded-lg bg-warning-500 text-white text-center">
                  <p className="font-medium">Warning</p>
                </div>
                <div className="p-4 rounded-lg bg-error-500 text-white text-center">
                  <p className="font-medium">Error</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
