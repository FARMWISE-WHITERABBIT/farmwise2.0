-- Shop System: Products, Services, Inventory, Orders, and Payments
-- This system allows organization admins to create a shop where farmers can purchase products and services

-- Products and Services Table
CREATE TABLE IF NOT EXISTS shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL, -- 'product', 'service', 'equipment_rental', 'input', 'other'
  type VARCHAR(100), -- More specific: 'seed', 'fertilizer', 'pesticide', 'tractor_lease', 'consultation', etc.
  price DECIMAL(12, 2) NOT NULL,
  unit VARCHAR(50), -- 'kg', 'bag', 'liter', 'hour', 'day', 'piece', etc.
  
  -- Inventory Management (for products only)
  track_inventory BOOLEAN DEFAULT false,
  current_stock INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  reorder_point INTEGER,
  
  -- Product Details
  sku VARCHAR(100),
  brand VARCHAR(100),
  specifications JSONB, -- Flexible field for product-specific details
  
  -- Service Details (for services/rentals)
  duration_unit VARCHAR(50), -- 'hour', 'day', 'week', 'month' for services
  min_duration INTEGER, -- Minimum rental/service duration
  max_duration INTEGER, -- Maximum rental/service duration
  
  -- Media
  image_url TEXT,
  additional_images TEXT[], -- Array of image URLs
  
  -- Availability
  is_active BOOLEAN DEFAULT true,
  available_from TIMESTAMP,
  available_until TIMESTAMP,
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT positive_price CHECK (price >= 0),
  CONSTRAINT positive_stock CHECK (current_stock >= 0)
);

-- Orders Table
CREATE TABLE IF NOT EXISTS shop_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  
  -- Order Details
  total_amount DECIMAL(12, 2) NOT NULL,
  discount_amount DECIMAL(12, 2) DEFAULT 0,
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  final_amount DECIMAL(12, 2) NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'processing', 'ready', 'completed', 'cancelled'
  payment_status VARCHAR(50) DEFAULT 'unpaid', -- 'unpaid', 'partial', 'paid', 'refunded'
  payment_method VARCHAR(50), -- 'online', 'cash', 'bank_transfer', 'credit', 'mobile_money'
  
  -- Delivery/Fulfillment
  delivery_method VARCHAR(50), -- 'pickup', 'delivery', 'digital'
  delivery_address TEXT,
  delivery_date TIMESTAMP,
  fulfillment_date TIMESTAMP,
  
  -- Notes
  customer_notes TEXT,
  admin_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT positive_amounts CHECK (
    total_amount >= 0 AND 
    discount_amount >= 0 AND 
    tax_amount >= 0 AND 
    final_amount >= 0
  )
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS shop_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
  shop_item_id UUID NOT NULL REFERENCES shop_items(id) ON DELETE RESTRICT,
  
  -- Item Details (snapshot at time of order)
  item_name VARCHAR(255) NOT NULL,
  item_category VARCHAR(100),
  unit_price DECIMAL(12, 2) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50),
  
  -- Service-specific
  duration INTEGER, -- For rentals/services
  duration_unit VARCHAR(50),
  service_date TIMESTAMP,
  
  -- Pricing
  subtotal DECIMAL(12, 2) NOT NULL,
  discount DECIMAL(12, 2) DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT positive_quantity CHECK (quantity > 0),
  CONSTRAINT positive_price CHECK (unit_price >= 0)
);

-- Payments Table
CREATE TABLE IF NOT EXISTS shop_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
  
  -- Payment Details
  amount DECIMAL(12, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  
  -- Transaction Details
  transaction_id VARCHAR(255),
  transaction_reference VARCHAR(255),
  payment_gateway VARCHAR(100), -- 'stripe', 'paystack', 'flutterwave', etc.
  
  -- Payment Proof (for offline payments)
  proof_of_payment_url TEXT,
  
  -- Metadata
  payment_date TIMESTAMP,
  processed_by UUID REFERENCES users(id),
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Inventory Transactions Table (for tracking stock movements)
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_item_id UUID NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
  
  -- Transaction Details
  transaction_type VARCHAR(50) NOT NULL, -- 'purchase', 'sale', 'adjustment', 'return', 'damage'
  quantity_change INTEGER NOT NULL, -- Positive for additions, negative for reductions
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  
  -- Reference
  reference_type VARCHAR(50), -- 'order', 'manual', 'return'
  reference_id UUID, -- Could be order_id or other reference
  
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_shop_items_org ON shop_items(organization_id);
CREATE INDEX idx_shop_items_category ON shop_items(category);
CREATE INDEX idx_shop_items_active ON shop_items(is_active);
CREATE INDEX idx_shop_orders_org ON shop_orders(organization_id);
CREATE INDEX idx_shop_orders_farmer ON shop_orders(farmer_id);
CREATE INDEX idx_shop_orders_status ON shop_orders(status);
CREATE INDEX idx_shop_orders_payment_status ON shop_orders(payment_status);
CREATE INDEX idx_shop_order_items_order ON shop_order_items(order_id);
CREATE INDEX idx_shop_payments_order ON shop_payments(order_id);
CREATE INDEX idx_inventory_transactions_item ON inventory_transactions(shop_item_id);

-- Create function to update inventory on order
CREATE OR REPLACE FUNCTION update_inventory_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update inventory for products that track inventory
  IF EXISTS (
    SELECT 1 FROM shop_items 
    WHERE id = NEW.shop_item_id 
    AND track_inventory = true
  ) THEN
    -- Reduce stock
    UPDATE shop_items
    SET 
      current_stock = current_stock - NEW.quantity,
      updated_at = NOW()
    WHERE id = NEW.shop_item_id;
    
    -- Record inventory transaction
    INSERT INTO inventory_transactions (
      shop_item_id,
      transaction_type,
      quantity_change,
      quantity_before,
      quantity_after,
      reference_type,
      reference_id,
      notes
    )
    SELECT 
      NEW.shop_item_id,
      'sale',
      -NEW.quantity,
      current_stock + NEW.quantity,
      current_stock,
      'order',
      NEW.order_id,
      'Stock reduced due to order ' || (SELECT order_number FROM shop_orders WHERE id = NEW.order_id)
    FROM shop_items
    WHERE id = NEW.shop_item_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory updates
CREATE TRIGGER trigger_update_inventory_on_order
AFTER INSERT ON shop_order_items
FOR EACH ROW
EXECUTE FUNCTION update_inventory_on_order();

-- Create function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Create trigger for order number generation
CREATE TRIGGER trigger_generate_order_number
BEFORE INSERT ON shop_orders
FOR EACH ROW
WHEN (NEW.order_number IS NULL)
EXECUTE FUNCTION generate_order_number();

-- Enable RLS
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shop_items
CREATE POLICY "Users can view active shop items in their organization"
  ON shop_items FOR SELECT
  USING (
    is_active = true AND
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage shop items"
  ON shop_items FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for shop_orders
CREATE POLICY "Farmers can view their own orders"
  ON shop_orders FOR SELECT
  USING (
    farmer_id IN (
      SELECT id FROM farmers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all orders in their organization"
  ON shop_orders FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'extension_agent')
    )
  );

CREATE POLICY "Farmers can create orders"
  ON shop_orders FOR INSERT
  WITH CHECK (
    farmer_id IN (
      SELECT id FROM farmers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage orders"
  ON shop_orders FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );
